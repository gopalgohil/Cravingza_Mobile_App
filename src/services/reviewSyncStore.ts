// @ts-nocheck
// Cravingza Real-Time Review Sync Store
// Connects customer order review submission with Restaurant Admin Customer Reviews Tab

type ReviewListener = () => void;

let reviewListeners: ReviewListener[] = [];
let sharedReviews: any[] = [];

export const getSharedReviews = () => sharedReviews;

export const setSharedReviews = (reviews: any[]) => {
  if (Array.isArray(reviews)) {
    sharedReviews = reviews;
    notifyReviewListeners();
  }
};

export const addSharedReview = (newReview: any) => {
  if (!newReview) return;
  const id = newReview._id || newReview.id || `rev_${Date.now()}`;
  const idx = sharedReviews.findIndex((r) => (r._id || r.id) === id);
  if (idx !== -1) {
    sharedReviews[idx] = { ...sharedReviews[idx], ...newReview };
  } else {
    sharedReviews.unshift({
      _id: id,
      customerName: newReview.customerName || newReview.userName || newReview.user?.name || 'Customer',
      rating: Number(newReview.rating) || 5,
      comment: newReview.comment || newReview.review || 'Great food and fast service!',
      createdAt: newReview.createdAt || new Date().toISOString(),
      orderId: newReview.orderId || 'ord_live',
      items: newReview.items || [],
      reply: newReview.reply || null,
      ...newReview,
    });
  }
  notifyReviewListeners();
};

export const subscribeReviewSync = (listener: ReviewListener) => {
  reviewListeners.push(listener);
  return () => {
    reviewListeners = reviewListeners.filter((l) => l !== listener);
  };
};

const notifyReviewListeners = () => {
  reviewListeners.forEach((l) => l());
};
