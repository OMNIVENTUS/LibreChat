import mongoose, { Schema } from 'mongoose';
import { FileSources } from 'librechat-data-provider';
import type { IMongoFile } from '~/types';

const file: Schema<IMongoFile> = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    conversationId: {
      type: String,
      ref: 'Conversation',
      index: true,
    },
    file_id: {
      type: String,
      index: true,
      required: true,
    },
    temp_file_id: {
      type: String,
    },
    bytes: {
      type: Number,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    filepath: {
      type: String,
      required: true,
    },
    object: {
      type: String,
      required: true,
      default: 'file',
    },
    embedded: {
      type: Boolean,
    },
    type: {
      type: String,
      required: true,
    },
    text: {
      type: String,
    },
    context: {
      type: String,
    },
    usage: {
      type: Number,
      required: true,
      default: 0,
    },
    source: {
      type: String,
      default: FileSources.local,
    },
    model: {
      type: String,
    },
    width: Number,
    height: Number,
    metadata: {
      fileIdentifier: String,
    },
    expiresAt: {
      type: Date,
      expires: 3600, // 1 hour in seconds
    },
    // [OMNIVENTUS-START] shared/preloaded files: scope-based access control
    scope: {
      type: String,
      enum: ['private', 'public', 'shared'],
      default: 'private',
    },
    access_control: {
      type: [
        {
          type: String, // user IDs or role names
        },
      ],
      default: [],
    },
    // [OMNIVENTUS-END]
  },
  {
    timestamps: true,
  },
);

file.index({ createdAt: 1, updatedAt: 1 });

export default file;
