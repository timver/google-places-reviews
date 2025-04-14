// https://developers.google.com/maps/documentation/javascript/place-id
let placeId;
const overallContainerId = 'google-rating';
const reviewsContainerId = 'google-reviews';
const loadMoreButtonId = 'load-more';
const languageId = 'language';
let currentNextPageToken = null; // To store the next_page_token for pagination

window.initMap = async () => {
	try {
		const configRes = await fetch('/config');
		const config = await configRes.json();
		placeId = config.placeId;
	  	const place = await fetchPlaceDetails(placeId);
	  	renderPlaceRating(place.result, overallContainerId);
	  	renderGoogleReviews(place.result.reviews, reviewsContainerId);
  
	  	// Initially load the reviews and handle pagination if any
	  	if (place.result?.reviews?.length) {
			currentNextPageToken = place.next_page_token;
			toggleLoadMoreButton(currentNextPageToken);
	  	}
	} catch (error) {
	  	console.error("Failed to load place details:", error);
	}
};

// Function to fetch place details using REST API with pagination support
async function fetchPlaceDetails(placeId, nextPageToken = null) {
	try {
		const languageSelect = document.getElementById(languageId);
	  	// If nextPageToken is provided, append it to the request
	  	let url = `/api/place-details?placeId=${placeId}`;
	  	if (nextPageToken) {
			url += `&nextPageToken=${nextPageToken}`;
	  	}

		if (languageSelect) {
			url += `&language=${languageSelect.value}`;
	  	}
  
	  	const response = await fetch(url);

	  	if (!response.ok) {
			return;
		}
		
		const data = await response.json();
		logData(data, 'Place Details Response');
	  	return {
			result: data.result,
			nextPageToken: data.next_page_token // Pass nextPageToken to handle pagination
	  	};
	} catch (error) {
	  console.error('Error fetching place details:', error);
	}
}

// Function to fetch and render reviews (with load more functionality)
function fetchAndRenderReviews(nextPageToken) {
	fetchPlaceDetails(placeId, nextPageToken)
	  .then(data => {
		const reviews = data.reviews;
		renderGoogleReviews(reviews, reviewsContainerId);
  
		// Update the nextPageToken for subsequent loads
		currentNextPageToken = data.nextPageToken;
  
		// Toggle the Load More button visibility based on nextPageToken
		toggleLoadMoreButton(currentNextPageToken);
	  })
	  .catch(error => console.error('Error fetching reviews:', error));
}

// Function to toggle Load More button visibility
function toggleLoadMoreButton(nextPageToken) {
	const loadMoreButton = document.getElementById(loadMoreButtonId);
	loadMoreButton.disabled = !nextPageToken;
}
  
// Function to render Google Reviews (your existing function)
function renderGoogleReviews(reviews, containerId) {
	const targetDiv = document.getElementById(containerId);
	const template = document.getElementById('google-review-template');
	targetDiv.innerHTML = ''; // Clear previous content
  
	reviews.forEach(review => {
	  const { author_name, author_url, rating, time, text, profile_photo_url, relative_time_description } = review;
  
	  const date = new Date(time * 1000);
	  const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
	  const proxiedPhotoUrl = profile_photo_url
		? `/proxy-image?url=${encodeURIComponent(profile_photo_url)}`
		: 'https://via.placeholder.com/40';
	  
	  // Clone template content
	  const clone = document.importNode(template.content, true);
  
	  clone.querySelector('.reviewer-name').textContent = author_name;
	  clone.querySelector('.review-date').textContent = formattedDate;
	  clone.querySelector('.review-text').textContent = text;
	  clone.querySelector('.review-relative-date').textContent = relative_time_description;
	  clone.querySelector('.reviewer-photo').src = proxiedPhotoUrl;
	  clone.querySelector('.reviewer-photo').alt = author_name;
	  clone.querySelector('.review-url').href = author_url;
  
	  // Set star rating
	  const starsContainer = clone.querySelector('.review-stars');
	  for (let i = 0; i < 5; i++) {
		const starClass = i < rating ? 'bi-star-fill' : 'bi-star';
		starsContainer.innerHTML += `<i class="bi ${starClass}"></i>`;
	  }
  
	  targetDiv.appendChild(clone);
	});
}

function renderPlaceRating(place, containerId) {
	const container = document.getElementById(containerId);
	const template = document.getElementById('place-rating-template');
	const clone = document.importNode(template.content, true);
  
	// Set place information into the template
	clone.querySelector('.rating').innerText = place.rating || 'N/A';
	clone.querySelector('.stars').innerHTML = renderStars(place.rating);
	clone.querySelector('.user-ratings-total').innerText = place.user_ratings_total || 0;
  
	// Append the rendered card to the container
	container.appendChild(clone);
}

// Helper function to render star ratings
function renderStars(rating) {
	const fullStars = Math.floor(rating);
	const halfStar = (rating % 1) >= 0.5 ? 1 : 0;
	const emptyStars = 5 - fullStars - halfStar;
  
	let starsHTML = '';
  
	// Render full stars
	for (let i = 0; i < fullStars; i++) {
	  starsHTML += '<i class="bi bi-star-fill" style="color: #f39c12;"></i>';
	}
  
	// Render half star
	if (halfStar) {
	  starsHTML += '<i class="bi bi-star-half" style="color: #f39c12;"></i>';
	}
  
	// Render empty stars
	for (let i = 0; i < emptyStars; i++) {
	  starsHTML += '<i class="bi bi-star" style="color: #f39c12;"></i>';
	}
  
	return starsHTML;
}

function logData(data, label = 'Data') {
	console.group(label); // Creates a group in the console for better organization
	console.log(data);    // Logs the data itself
	console.groupEnd();   // Ends the group for better separation
}

// Event listener for the "Load More" button
document.getElementById(loadMoreButtonId).addEventListener('click', () => {
	if (currentNextPageToken) {
	  fetchAndRenderReviews(currentNextPageToken); // Fetch and render more reviews when the button is clicked
	}
});

document.getElementById(languageId).addEventListener('change', () => {
	// Clear previous content
	document.getElementById('google-rating').innerHTML = ''; // Clear rating container
	document.getElementById('google-reviews').innerHTML = ''; // Clear reviews container
	
	window.initMap();
});
  