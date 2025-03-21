const { getResponseSender, Constants } = require('librechat-data-provider');
const { createAbortController, handleAbortError } = require('~/server/middleware');
const { sendMessage, createOnProgress } = require('~/server/utils');
const { saveMessage } = require('~/models');
const { logger } = require('~/config');
const BusinessActionsService = require('~/server/services/BusinessActionsService');

const AskController = async (req, res, next, initializeClient, addTitle) => {
  let {
    text,
    endpointOption,
    conversationId,
    modelDisplayLabel,
    parentMessageId = null,
    overrideParentMessageId = null,
  } = req.body;

  logger.debug('[AskController]', {
    text,
    conversationId,
    ...endpointOption,
    modelsConfig: endpointOption.modelsConfig ? 'exists' : '',
  });

  let userMessage;
  let userMessagePromise;
  let promptTokens;
  let userMessageId;
  let responseMessageId;
  const sender = getResponseSender({
    ...endpointOption,
    model: endpointOption.modelOptions.model,
    modelDisplayLabel,
  });
  const newConvo = !conversationId;
  const user = req.user.id;

  const getReqData = (data = {}) => {
    for (let key in data) {
      if (key === 'userMessage') {
        userMessage = data[key];
        userMessageId = data[key].messageId;
      } else if (key === 'userMessagePromise') {
        userMessagePromise = data[key];
      } else if (key === 'responseMessageId') {
        responseMessageId = data[key];
      } else if (key === 'promptTokens') {
        promptTokens = data[key];
      } else if (!conversationId && key === 'conversationId') {
        conversationId = data[key];
      }
    }
  };

  // Start fetching business actions in parallel
  const businessActionsPromise = BusinessActionsService.generateActions(text, user, {
    conversationId,
    modelOptions: endpointOption.modelOptions,
  });

  let getText;

  try {
    const { client } = await initializeClient({ req, res, endpointOption });
    const { onProgress: progressCallback, getPartialText } = createOnProgress();

    getText = client.getStreamText != null ? client.getStreamText.bind(client) : getPartialText;

    const getAbortData = () => ({
      sender,
      conversationId,
      userMessagePromise,
      messageId: responseMessageId,
      parentMessageId: overrideParentMessageId ?? userMessageId,
      text: getText(),
      userMessage,
      promptTokens,
    });

    const { abortController, onStart } = createAbortController(req, res, getAbortData, getReqData);

    res.on('close', () => {
      logger.debug('[AskController] Request closed');
      if (!abortController) {
        return;
      } else if (abortController.signal.aborted) {
        return;
      } else if (abortController.requestCompleted) {
        return;
      }

      abortController.abort();
      logger.debug('[AskController] Request aborted on close');
    });

    const messageOptions = {
      user,
      parentMessageId,
      conversationId,
      overrideParentMessageId,
      getReqData,
      onStart,
      abortController,
      progressCallback,
      progressOptions: {
        res,
        // parentMessageId: overrideParentMessageId || userMessageId,
      },
    };

    /** @type {TMessage} */
    let response = await client.sendMessage(text, messageOptions);
    response.endpoint = endpointOption.endpoint;

    const { conversation = {} } = await client.responsePromise;
    conversation.title =
      conversation && !conversation.title ? null : conversation?.title || 'New Chat';

    if (client.options.attachments) {
      userMessage.files = client.options.attachments;
      conversation.model = endpointOption.modelOptions.model;
      delete userMessage.image_urls;
    } else {
      logger.debug('[AskController] No attachment !!!!');
    }

    if (!abortController.signal.aborted) {
      let actions;
      // Process business actions in parallel
      try {
        actions = await businessActionsPromise;
        const responseMessageId = response.messageId;

        // If actions are found, send them as an SSE event
        if (actions && actions.length > 0) {
          logger.debug('[AskController] save response message with actions!!!!');
          await saveMessage(
            req,
            { ...response, user, contextualActions: actions },
            { context: 'api/server/controllers/AskController.js - update response with actions' },
          );
          // Send actions data to the client via SSE
          // Include both messageId and the full actions array
          //setTimeout(() => {
          res.write(`event: business_actions\ndata: ${JSON.stringify({
            messageId: responseMessageId,
            actions: actions,
            count: actions.length,
          })}\n\n`);
          //}, 10000);
        } else {
          res.write(`event: business_actions\ndata: ${JSON.stringify({
            messageId: responseMessageId,
            actions: [],
            count: 0,
          })}\n\n`);
          logger.debug('[AskController] No business actions generated');
        }
      } catch (error) {
        logger.error('[AskController] Error processing business actions:', error);
        // Continue with the response even if business actions fail
      }

      // Now send the final message with everything included
      logger.debug('[AskController] sendMessage !!!!');
      //setTimeout(() => {
      sendMessage(res, {
        final: true,
        conversation,
        title: conversation.title,
        requestMessage: userMessage,
        responseMessage: { ...response, contextualActions: actions || [] },
      });
      res.end();
      //}, 300000);

      if (!client.savedMessageIds.has(response.messageId)) {
        logger.debug('[AskController] saveMessage !!!!');
        await saveMessage(
          req,
          { ...response, user },
          { context: 'api/server/controllers/AskController.js - response end' },
        );
      }

      if (addTitle && parentMessageId === Constants.NO_PARENT && newConvo) {
        logger.debug('[AskController] addTitle !!!!');
        await addTitle(req, {
          text,
          response,
          client,
        });
      }
    }

    if (!client.skipSaveUserMessage) {
      logger.debug('[AskController] dont skip save user message !!!!');
      await saveMessage(req, userMessage, {
        context: 'api/server/controllers/AskController.js - don\'t skip saving user message',
      });
    }
  } catch (error) {
    const partialText = getText && getText();
    handleAbortError(res, req, error, {
      sender,
      partialText,
      conversationId,
      messageId: responseMessageId,
      parentMessageId: overrideParentMessageId ?? userMessageId ?? parentMessageId,
    }).catch((err) => {
      logger.error('[AskController] Error in `handleAbortError`', err);
    });
  }
};

module.exports = AskController;
