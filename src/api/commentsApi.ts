import apiClient from "@/lib/apiClient";
import { isRecord, pickNumber, pickString, pickBoolean } from "@/api/utils";
import type { ApiEnvelope } from "@/types/api";

export type Comment = {
  commentId: string;
  momentId: string;
  parentCommentId?: string;
  authorWalletAddress: string;
  content?: string;
  replyCount: number;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type CommentListResponse = {
  comments: Comment[];
  total: number;
  page: number;
  perPage: number;
};

export const COMMENTS_QUERY_KEYS = {
  moment: (momentId: string) => ["moments", "comments", momentId] as const,
  replies: (commentId: string, page = 1) => ["moments", "comment-replies", commentId, page] as const,
  repliesRoot: ["moments", "comment-replies"] as const,
};

function normalizeComment(raw: unknown): Comment {
  const r = isRecord(raw) ? raw : {};
  return {
    commentId:           pickString(r.commentId, r.comment_id) ?? "",
    momentId:            pickString(r.momentId, r.moment_id) ?? "",
    parentCommentId:     pickString(r.parentCommentId, r.parent_comment_id),
    authorWalletAddress: pickString(r.authorWalletAddress, r.author_wallet_address) ?? "",
    content:             pickString(r.content),
    replyCount:          pickNumber(r.replyCount, r.reply_count) ?? 0,
    isEdited:            pickBoolean(r.isEdited, r.is_edited) ?? false,
    isDeleted:           pickBoolean(r.isDeleted, r.is_deleted) ?? false,
    createdAt:           pickString(r.createdAt, r.created_at) ?? "",
    updatedAt:           pickString(r.updatedAt, r.updated_at) ?? "",
    deletedAt:           pickString(r.deletedAt, r.deleted_at),
  };
}

function unwrapComments(data: unknown, fallbackPage: number, fallbackPerPage: number): CommentListResponse {
  const outer = isRecord(data) ? data : {};
  // handle both { data: { comments } } and { comments } envelopes
  const payload = isRecord(outer.data) ? outer.data : outer;
  const comments = Array.isArray(payload.comments)
    ? payload.comments.map(normalizeComment)
    : [];
  return {
    comments,
    total:   pickNumber(payload.total) ?? comments.length,
    page:    pickNumber(payload.page) ?? fallbackPage,
    perPage: pickNumber(payload.perPage, payload.per_page) ?? fallbackPerPage,
  };
}

export const commentsApi = {
  list: async (momentId: string, page = 1, perPage = 50): Promise<CommentListResponse> => {
    const { data } = await apiClient.get<ApiEnvelope<unknown>>(`/moments/${momentId}/comments`, {
      params: { page, perPage },
    });
    return unwrapComments(data, page, perPage);
  },

  listReplies: async (commentId: string, page = 1, perPage = 50): Promise<CommentListResponse> => {
    const { data } = await apiClient.get<ApiEnvelope<unknown>>(`/moments/comments/${commentId}/replies`, {
      params: { page, perPage },
    });
    return unwrapComments(data, page, perPage);
  },

  create: async (momentId: string, content: string): Promise<Comment> => {
    const { data } = await apiClient.post<ApiEnvelope<unknown>>(`/moments/${momentId}/comments`, { content });
    const outer = isRecord(data) ? data : {};
    return normalizeComment(isRecord(outer.data) ? outer.data : outer);
  },

  createReply: async (commentId: string, content: string): Promise<Comment> => {
    const { data } = await apiClient.post<ApiEnvelope<unknown>>(`/moments/comments/${commentId}/replies`, { content });
    const outer = isRecord(data) ? data : {};
    return normalizeComment(isRecord(outer.data) ? outer.data : outer);
  },

  update: async (commentId: string, content: string): Promise<Comment> => {
    const { data } = await apiClient.patch<ApiEnvelope<unknown>>(`/moments/comments/${commentId}`, { content });
    const outer = isRecord(data) ? data : {};
    return normalizeComment(isRecord(outer.data) ? outer.data : outer);
  },

  remove: async (commentId: string): Promise<void> => {
    await apiClient.delete(`/moments/comments/${commentId}`);
  },
};
