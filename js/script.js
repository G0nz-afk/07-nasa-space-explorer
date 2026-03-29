// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.getElementById('getImagesButton');
const spaceFactText = document.getElementById('spaceFactText');
const gallery = document.getElementById('gallery');
const apodModal = document.getElementById('apodModal');
const closeModalButton = document.getElementById('closeModalButton');
const modalMedia = document.getElementById('modalMedia');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');

// NASA API endpoint and key
// NOTE: DEMO_KEY has usage limits. You can replace it with your own API key.
const APOD_URL = 'https://api.nasa.gov/planetary/apod';
const API_KEY = '7ucwaF7ZXxhwOmDwkQkv9ANsDW6A3g753mPZSpuW';

// Keep the latest gallery items so modal details can be opened by index
let currentGalleryItems = [];

// Short space facts to show students one random fact each page refresh
const spaceFacts = [
	'One day on Venus is longer than one year on Venus.',
	'The Sun makes up about 99.8% of the mass in our solar system.',
	'Neutron stars can spin hundreds of times each second.',
	'Saturn could float in water because it is less dense than water.',
	'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.',
	'There are more stars in the universe than grains of sand on Earth.',
	'Jupiter has the shortest day of any planet in our solar system.',
	'The footprints left on the Moon can last for millions of years.'
];

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Show one random fact when the app loads
displayRandomSpaceFact();

// When the button is clicked, fetch APOD data for the selected date range
getImagesButton.addEventListener('click', getSpaceImages);

// Open detail modal when a gallery card is clicked
gallery.addEventListener('click', handleGalleryClick);

// Close controls for the modal
closeModalButton.addEventListener('click', closeModal);
apodModal.addEventListener('click', handleBackdropClick);
document.addEventListener('keydown', handleEscapeKey);

// Load images immediately for the default date range when the page opens
getSpaceImages();

function displayRandomSpaceFact() {
	const randomIndex = Math.floor(Math.random() * spaceFacts.length);
	const randomFact = spaceFacts[randomIndex];
	spaceFactText.textContent = randomFact;
}

async function getSpaceImages() {
	const startDate = startInput.value;
	const endDate = endInput.value;

	if (!startDate || !endDate) {
		showMessage('Please choose both a start date and an end date.');
		return;
	}

	if (startDate > endDate) {
		showMessage('Start date must be before or equal to end date.');
		return;
	}

	showMessage('Loading space images...');

	try {
		const requestUrl = `${APOD_URL}?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}&thumbs=true`;
		const response = await fetch(requestUrl);

		if (!response.ok) {
			throw new Error(`NASA API request failed with status ${response.status}`);
		}

		const data = await response.json();

		// APOD can return either an array (date range) or a single object (single date)
		const apodItems = Array.isArray(data) ? data : [data];

		// Show newest first so students see the latest images at the top
		const sortedItems = [...apodItems].reverse();
		renderGallery(sortedItems);
	} catch (error) {
		showMessage('Could not load images right now. Please try again in a moment.');
		console.error('APOD fetch error:', error);
	}
}

function renderGallery(items) {
	currentGalleryItems = items;

	// Build one card per APOD entry (image or video)
	const cardsHtml = items
		.map((item, index) => {
			const mediaHtml = getMediaMarkup(item);

			return `
				<article class="gallery-item" data-index="${index}">
					<div class="gallery-media">
						${mediaHtml}
					</div>
					<p class="gallery-title"><strong>${item.title}</strong></p>
					<p class="gallery-date">${item.date}</p>
				</article>
			`;
		})
		.join('');

	gallery.innerHTML = cardsHtml || '<p class="placeholder">No APOD entries were found for that date range.</p>';
}

function getMediaMarkup(item) {
	if (item.media_type === 'image') {
		return `<img src="${item.url}" alt="${item.title}" />`;
	}

	if (item.media_type === 'video') {
		// If NASA gives an embeddable YouTube/Vimeo URL, show the video inline.
		if (isEmbeddableVideo(item.url)) {
			return `
				<div class="video-wrapper">
					<iframe
						src="${item.url}"
						title="${item.title}"
						loading="lazy"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowfullscreen
					></iframe>
				</div>
			`;
		}

		// If it is not embeddable, show a clear link for students to open.
		return `
			<p>
				This APOD item is a video.
				<a href="${item.url}" target="_blank" rel="noopener noreferrer">Watch video</a>
			</p>
		`;
	}

	// Fallback for any unexpected media type returned by the API.
	return `
		<p>
			This APOD item uses a media type that is not previewed here.
			<a href="${item.url}" target="_blank" rel="noopener noreferrer">Open media</a>
		</p>
	`;
}

function isEmbeddableVideo(url) {
	return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
}

function showMessage(messageText) {
	currentGalleryItems = [];
	closeModal();

	gallery.innerHTML = `
		<div class="placeholder">
			<p>${messageText}</p>
		</div>
	`;
}

function handleGalleryClick(event) {
	const clickedCard = event.target.closest('.gallery-item');

	if (!clickedCard) {
		return;
	}

	const itemIndex = Number(clickedCard.dataset.index);
	const selectedItem = currentGalleryItems[itemIndex];

	if (!selectedItem) {
		return;
	}

	openModal(selectedItem);
}

function openModal(item) {
	modalMedia.innerHTML = getModalMediaMarkup(item);
	modalTitle.textContent = item.title;
	modalDate.textContent = item.date;
	modalExplanation.textContent = item.explanation || 'No explanation is available for this entry.';

	apodModal.classList.add('is-open');
	apodModal.setAttribute('aria-hidden', 'false');
	document.body.style.overflow = 'hidden';
}

function closeModal() {
	apodModal.classList.remove('is-open');
	apodModal.setAttribute('aria-hidden', 'true');
	modalMedia.innerHTML = '';
	document.body.style.overflow = '';
}

function handleBackdropClick(event) {
	if (event.target === apodModal) {
		closeModal();
	}
}

function handleEscapeKey(event) {
	if (event.key === 'Escape' && apodModal.classList.contains('is-open')) {
		closeModal();
	}
}

function getModalMediaMarkup(item) {
	if (item.media_type === 'image') {
		return `<img src="${item.hdurl || item.url}" alt="${item.title}" />`;
	}

	if (item.media_type === 'video' && isEmbeddableVideo(item.url)) {
		return `
			<iframe
				src="${item.url}"
				title="${item.title}"
				loading="lazy"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				allowfullscreen
			></iframe>
		`;
	}

	return `<p><a href="${item.url}" target="_blank" rel="noopener noreferrer">Open this media in a new tab</a></p>`;
}
