/**
 * this function
 * if file has scope shared, we need to use the public entity_id
 *  Update query context handler to support shared file queries with 'public' entity_id
 */
const updateQueryBody = async (file, userMessageContent) => {
  const body = {
    file_id: file.file_id,
    query: userMessageContent,
    k: 4,
  };

  if (file.scope === 'shared') {
    body.entity_id = 'public';
  }
  return body;
};

module.exports = {
  updateQueryBody,
};
