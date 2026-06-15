import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageCircle,
  Pencil,
  Reply,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { requestOpenLoginModal } from "@/lib/loginModalBus";
import {
  commentsApi,
  COMMENTS_QUERY_KEYS,
  type Comment,
} from "@/api/commentsApi";
import { MOMENTS_QUERY_KEY_ROOT } from "@/constants/moments";
import type { Moment } from "@/types/api";

const COMMENT_CHAR_LIMIT = 500;
const COMMENTS_PER_PAGE = 50;

function formatRelativeTime(value?: string): string {
  if (!value) return "just now";
  const diff = Date.now() - new Date(value).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function shortenAddr(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ── Comment editor ─────────────────────────────────────────────────────────────
function CommentEditor({
  value, placeholder, submitLabel, isSubmitting, onChange, onSubmit, onCancel,
}: {
  value: string;
  placeholder: string;
  submitLabel: string;
  isSubmitting: boolean;
  onChange: (v: string) => void;
  onSubmit: () => Promise<void> | void;
  onCancel?: () => void;
}) {
  const canSubmit = value.trim().length > 0 && value.trim().length <= COMMENT_CHAR_LIMIT && !isSubmitting;

  return (
    <div className="rounded border border-white/8 bg-[#0a0f1b]/60 p-3">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={COMMENT_CHAR_LIMIT}
        className="w-full resize-none rounded border border-white/8 bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#9a35ff]/50 focus:ring-1 focus:ring-[#9a35ff]/20"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className={`font-tech text-[9px] tracking-wider ${value.length > COMMENT_CHAR_LIMIT - 50 ? "text-[#c084fc]" : "text-white/30"}`}>
          {value.length}/{COMMENT_CHAR_LIMIT}
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel}
              className="rounded border border-white/10 px-3 py-1.5 font-tech text-[10px] font-bold uppercase tracking-wider text-white/50 transition hover:border-white/20 hover:text-white"
            >
              Cancel
            </button>
          )}
          <button type="button" onClick={() => void onSubmit()} disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded bg-[#9a35ff] px-4 py-1.5 font-tech text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_0_12px_rgba(154,53,255,0.3)] transition hover:bg-[#8525eb] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Comment thread item ────────────────────────────────────────────────────────
function CommentItem({
  comment, currentAddr, isAuthenticated,
  onCreateReply, onUpdateComment, onDeleteComment,
  activeReplyId, activeUpdateId, activeDeleteId,
  isReply = false,
}: {
  comment: Comment;
  currentAddr?: string | null;
  isAuthenticated: boolean;
  onCreateReply: (commentId: string, content: string) => Promise<void>;
  onUpdateComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  activeReplyId?: string | null;
  activeUpdateId?: string | null;
  activeDeleteId?: string | null;
  isReply?: boolean;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [editDraft, setEditDraft] = useState(comment.content ?? "");

  useEffect(() => {
    setEditDraft(comment.content ?? "");
    setIsEditing(false);
    setIsConfirmingDelete(false);
  }, [comment.commentId, comment.content]);

  const ownsComment = Boolean(currentAddr) && currentAddr === comment.authorWalletAddress.toLowerCase();
  const isReplySubmitting = activeReplyId === comment.commentId;
  const isUpdating = activeUpdateId === comment.commentId;
  const isDeleting = activeDeleteId === comment.commentId;

  const repliesQuery = useQuery({
    queryKey: COMMENTS_QUERY_KEYS.replies(comment.commentId),
    queryFn: () => commentsApi.listReplies(comment.commentId, 1, COMMENTS_PER_PAGE),
    enabled: !isReply && showReplies && comment.replyCount > 0,
  });

  return (
    <div className={`rounded border p-4 ${isReply ? "border-white/5 bg-white/[0.02]" : "border-white/8 bg-[#0a0f1b]/50"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded border border-[#9a35ff]/25 bg-[#9a35ff]/10 px-2 py-0.5 font-tech text-[9px] font-bold tracking-wider text-[#c084fc]">
          {shortenAddr(comment.authorWalletAddress)}
        </span>
        {ownsComment && (
          <span className="rounded border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-tech text-[9px] font-bold tracking-wider text-emerald-400">You</span>
        )}
        <span className="text-[10px] text-white/35">{formatRelativeTime(comment.createdAt)}</span>
        {comment.isEdited && !comment.isDeleted && <span className="text-[10px] text-white/25">edited</span>}
      </div>

      <div className="mt-2.5">
        {comment.isDeleted ? (
          <p className="text-xs italic text-white/30">This comment was deleted.</p>
        ) : isEditing ? (
          <CommentEditor
            value={editDraft} placeholder="Update your comment" submitLabel="Save"
            isSubmitting={isUpdating} onChange={setEditDraft}
            onSubmit={async () => { await onUpdateComment(comment.commentId, editDraft); setIsEditing(false); }}
            onCancel={() => { setIsEditing(false); setEditDraft(comment.content ?? ""); }}
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-6 text-white/80">{comment.content}</p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {!isReply && !comment.isDeleted && (
          <button type="button"
            onClick={() => { if (!isAuthenticated) { requestOpenLoginModal(); return; } setIsReplying((c) => !c); setIsConfirmingDelete(false); }}
            className="inline-flex items-center gap-1 font-tech text-[9px] font-bold uppercase tracking-wider text-white/40 transition hover:text-[#c084fc]"
          >
            <Reply className="h-3 w-3" /> Reply
          </button>
        )}
        {!isReply && comment.replyCount > 0 && (
          <button type="button" onClick={() => setShowReplies((c) => !c)}
            className="inline-flex items-center gap-1 font-tech text-[9px] font-bold uppercase tracking-wider text-white/40 transition hover:text-white/70"
          >
            {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showReplies ? "Hide" : "View"} replies ({comment.replyCount})
          </button>
        )}
        {ownsComment && !comment.isDeleted && !isEditing && !isConfirmingDelete && (
          <>
            <button type="button" onClick={() => { setIsEditing(true); setIsReplying(false); }}
              className="inline-flex items-center gap-1 font-tech text-[9px] font-bold uppercase tracking-wider text-white/40 transition hover:text-white/70"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
            <button type="button" onClick={() => { setIsConfirmingDelete(true); setIsReplying(false); }}
              className="inline-flex items-center gap-1 font-tech text-[9px] font-bold uppercase tracking-wider text-white/40 transition hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </>
        )}
      </div>

      {isConfirmingDelete && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded border border-red-500/25 bg-red-500/5 p-3">
          <span className="font-tech text-[10px] font-bold text-red-400">Delete this {isReply ? "reply" : "comment"}?</span>
          <button type="button" onClick={() => void onDeleteComment(comment.commentId)} disabled={isDeleting}
            className="rounded border border-red-500/40 bg-red-500/20 px-3 py-1 font-tech text-[9px] font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-500/30 disabled:opacity-50"
          >
            {isDeleting ? "Deleting…" : "Confirm"}
          </button>
          <button type="button" onClick={() => setIsConfirmingDelete(false)}
            className="rounded border border-white/10 px-3 py-1 font-tech text-[9px] font-bold uppercase tracking-wider text-white/40 transition hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {isReplying && (
        <div className="mt-3">
          <CommentEditor
            value={replyDraft} placeholder="Reply to this thread" submitLabel="Reply"
            isSubmitting={isReplySubmitting} onChange={setReplyDraft}
            onSubmit={async () => { await onCreateReply(comment.commentId, replyDraft); setReplyDraft(""); setIsReplying(false); setShowReplies(true); }}
            onCancel={() => { setIsReplying(false); setReplyDraft(""); }}
          />
        </div>
      )}

      {!isReply && showReplies && (
        <div className="mt-4 border-l border-white/8 pl-4">
          {repliesQuery.isLoading ? (
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading replies…
            </div>
          ) : repliesQuery.isError ? (
            <div className="rounded border border-red-500/20 bg-red-500/5 p-3">
              <p className="text-xs text-red-400">Replies could not be loaded.</p>
              <button type="button" onClick={() => void repliesQuery.refetch()} className="mt-2 font-tech text-[9px] font-bold uppercase tracking-wider text-red-400/70 underline">Try again</button>
            </div>
          ) : (repliesQuery.data?.comments ?? []).length > 0 ? (
            <div className="space-y-2.5">
              {repliesQuery.data!.comments.map((reply) => (
                <CommentItem key={reply.commentId} comment={reply} currentAddr={currentAddr} isAuthenticated={isAuthenticated}
                  onCreateReply={onCreateReply} onUpdateComment={onUpdateComment} onDeleteComment={onDeleteComment}
                  activeReplyId={activeReplyId} activeUpdateId={activeUpdateId} activeDeleteId={activeDeleteId} isReply
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/30">No replies yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Thread panel ───────────────────────────────────────────────────────────────
export default function MomentThreadPanel({ moment }: { moment: Moment }) {
  const { isAuthenticated, player } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const momentId = moment.momentId;
  const currentAddr = player?.walletAddress?.toLowerCase();

  useEffect(() => { setDraft(""); }, [momentId]);

  const commentsQuery = useQuery({
    queryKey: COMMENTS_QUERY_KEYS.moment(momentId),
    queryFn: () => commentsApi.list(momentId, 1, COMMENTS_PER_PAGE),
    enabled: Boolean(momentId),
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.moment(momentId) }),
      queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.repliesRoot }),
      queryClient.invalidateQueries({ queryKey: [MOMENTS_QUERY_KEY_ROOT] }),
    ]);
  };

  const createCommentMutation = useMutation({
    mutationFn: (content: string) => commentsApi.create(momentId, content.trim()),
    onSuccess: async () => { setDraft(""); await invalidate(); toast.success("Comment posted"); },
    onError: (e) => toast.error("Comment could not be posted", { description: e instanceof Error ? e.message : undefined }),
  });

  const createReplyMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      commentsApi.createReply(commentId, content.trim()),
    onSuccess: async () => { await invalidate(); toast.success("Reply posted"); },
    onError: (e) => toast.error("Reply could not be posted", { description: e instanceof Error ? e.message : undefined }),
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      commentsApi.update(commentId, content.trim()),
    onSuccess: async () => { await invalidate(); toast.success("Comment updated"); },
    onError: (e) => toast.error("Comment could not be updated", { description: e instanceof Error ? e.message : undefined }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => commentsApi.remove(commentId),
    onSuccess: async () => { await invalidate(); toast.success("Comment deleted"); },
    onError: (e) => toast.error("Comment could not be deleted", { description: e instanceof Error ? e.message : undefined }),
  });

  const compactNum = (n: number) => new Intl.NumberFormat("en", { notation: "compact" }).format(n);

  return (
    <div className="arena-panel overflow-hidden border-white/8">
      <div className="flex items-center justify-between border-b border-white/6 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <MessageCircle className="h-4 w-4 shrink-0 text-[#c084fc]" />
          <h2 className="font-tech text-xs font-bold uppercase tracking-wider text-white/86">Community Thread</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded border border-[#9a35ff]/25 bg-[#9a35ff]/10 px-2.5 py-1 font-tech text-[9px] font-bold tracking-wider text-[#c084fc]">
          <MessageCircle className="h-2.5 w-2.5" />
          {compactNum(moment.numComments ?? 0)} comments
        </span>
      </div>

      <div className="p-5">
        <div className="mb-5">
          {isAuthenticated ? (
            <CommentEditor
              value={draft} placeholder="Share your take on this moment…" submitLabel="Comment"
              isSubmitting={createCommentMutation.isPending} onChange={setDraft}
              onSubmit={async () => { await createCommentMutation.mutateAsync(draft); }}
            />
          ) : (
            <div className="rounded border border-white/8 bg-white/[0.02] p-4">
              <p className="text-sm text-white/40">Connect from the navbar to comment, reply, edit, or delete your posts.</p>
              <button type="button" onClick={() => requestOpenLoginModal()}
                className="mt-3 rounded border border-[#9a35ff]/30 bg-[#9a35ff]/10 px-4 py-1.5 font-tech text-[10px] font-bold uppercase tracking-wider text-[#c084fc] transition hover:bg-[#9a35ff]/20"
              >
                Connect Wallet
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {commentsQuery.isLoading ? (
            <div className="flex items-center gap-2 rounded border border-white/8 bg-white/[0.02] p-4 text-sm text-white/40">
              <Loader2 className="h-4 w-4 animate-spin text-[#c084fc]" /> Loading comments…
            </div>
          ) : commentsQuery.isError ? (
            <div className="rounded border border-red-500/25 bg-red-500/5 p-4">
              <p className="text-sm text-red-400">Comments could not be loaded.</p>
              <button type="button" onClick={() => void commentsQuery.refetch()}
                className="mt-3 rounded border border-red-500/30 px-4 py-1.5 font-tech text-[9px] font-bold uppercase tracking-wider text-red-400 transition hover:bg-red-500/10"
              >Try again</button>
            </div>
          ) : (commentsQuery.data?.comments ?? []).length > 0 ? (
            commentsQuery.data!.comments.map((comment) => (
              <CommentItem
                key={comment.commentId} comment={comment} currentAddr={currentAddr}
                isAuthenticated={isAuthenticated}
                onCreateReply={async (cid, content) => { await createReplyMutation.mutateAsync({ commentId: cid, content }); }}
                onUpdateComment={async (cid, content) => { await updateCommentMutation.mutateAsync({ commentId: cid, content }); }}
                onDeleteComment={async (cid) => { await deleteCommentMutation.mutateAsync(cid); }}
                activeReplyId={createReplyMutation.isPending ? createReplyMutation.variables?.commentId : null}
                activeUpdateId={updateCommentMutation.isPending ? updateCommentMutation.variables?.commentId : null}
                activeDeleteId={deleteCommentMutation.isPending ? deleteCommentMutation.variables : null}
              />
            ))
          ) : (
            <div className="rounded border border-dashed border-white/10 px-6 py-10 text-center">
              <MessageCircle className="mx-auto h-9 w-9 text-[#9a35ff]/50" />
              <h3 className="mt-4 font-tech text-sm font-bold uppercase tracking-wider text-white/60">No comments yet</h3>
              <p className="mt-2 text-xs text-white/35">
                {isAuthenticated ? "Be the first to add context to this moment." : "Read access is public. Connect to start the thread."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
