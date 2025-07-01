// Initialize Firebase Auth
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('user-info');
const spinner = document.getElementById('spinner');
const form = document.getElementById('reviewForm');
const container = document.getElementById('reviewsContainer');
const clearBtn = document.getElementById('clearReviews');

let currentUser = null;
let userIsAdmin = false;

function showSpinner() {
  spinner.style.display = 'block';
}
function hideSpinner() {
  spinner.style.display = 'none';
}

function renderReview(doc) {
  const data = doc.data();
  const div = document.createElement('div');
  div.classList.add('review-card');
  div.innerHTML = `
    <strong>${data.name}</strong> <br>
    ⭐ ${data.rating} — ${data.text}<br>
    <small>${new Date(data.timestamp?.seconds * 1000).toLocaleString()}</small>
    <div class="reactions">
      <button class="react-btn" data-id="${doc.id}" data-emoji="👍">👍 ${data.reactions?.like || 0}</button>
      <button class="react-btn" data-id="${doc.id}" data-emoji="🔥">🔥 ${data.reactions?.fire || 0}</button>
      <button class="react-btn" data-id="${doc.id}" data-emoji="❤️">❤️ ${data.reactions?.heart || 0}</button>
    </div>
    ${userIsAdmin ? `<button data-id="${doc.id}" class="delete-btn">❌ Delete</button>` : ''}
  `;
  container.appendChild(div);
}

// Auth listeners
auth.onAuthStateChanged(user => {
  currentUser = user;
  if (user) {
    userInfo.textContent = `Signed in as ${user.displayName}`;
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    // Check admin email
    userIsAdmin = user.email === 'xoh.beats@gmail.com'; // Change to your admin email
    clearBtn.style.display = userIsAdmin ? 'block' : 'none';
  } else {
    userInfo.textContent = '';
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    userIsAdmin = false;
    clearBtn.style.display = 'none';
  }
  loadReviews();
});

loginBtn.onclick = () => auth.signInWithPopup(provider);
logoutBtn.onclick = () => auth.signOut();

// Load reviews with spinner
async function loadReviews() {
  showSpinner();
  container.innerHTML = '';
  const snapshot = await db.collection('reviews').orderBy('timestamp', 'desc').get();
  snapshot.forEach(doc => renderReview(doc));
  hideSpinner();
}

// Form submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) {
    alert('Please sign in to leave a review.');
    return;
  }
  const name = currentUser.displayName || 'Anonymous';
  const text = document.getElementById('reviewText').value.trim();
  const rating = parseInt(document.getElementById('reviewRating').value);
  if (!text || !rating) return alert('Please fill out all fields.');

  showSpinner();
  await db.collection('reviews').add({
    name,
    text,
    rating,
    timestamp: new Date(),
    reactions: { like: 0, fire: 0, heart: 0 }
  });
  form.reset();
  hideSpinner();
  loadReviews();
});

// Reaction button clicks
container.addEventListener('click', async (e) => {
  if (e.target.classList.contains('react-btn')) {
    const reviewId = e.target.dataset.id;
    const emoji = e.target.dataset.emoji;
    const reactionField = emoji === '👍' ? 'like' : emoji === '🔥' ? 'fire' : 'heart';

    const reviewRef = db.collection('reviews').doc(reviewId);
    const doc = await reviewRef.get();
    if (!doc.exists) return;

    const currentReactions = doc.data().reactions || {};
    const newCount = (currentReactions[reactionField] || 0) + 1;

    await reviewRef.update({
      [`reactions.${reactionField}`]: newCount
    });

    loadReviews();
  }

  // Delete with confirmation for admin
  if (e.target.classList.contains('delete-btn')) {
    if (!userIsAdmin) return alert('Unauthorized');
    if (!confirm('Are you sure you want to delete this review?')) return;
    await db.collection('reviews').doc(e.target.dataset.id).delete();
    loadReviews();
  }
});

// Clear all reviews (admin only)
clearBtn.addEventListener('click', async () => {
  if (!userIsAdmin) return alert('Unauthorized');
  if (!confirm('Are you sure you want to clear all reviews?')) return;

  showSpinner();
  const snap = await db.collection('reviews').get();
  const batch = db.batch();
  snap.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  hideSpinner();
  loadReviews();
});
