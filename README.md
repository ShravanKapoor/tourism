# Thrill Tourism

A static landing page for Thrill Tourism, a platform where tourists can contact hosts directly with no commission fees. The page is built with HTML and Bootstrap 5.

Status: beta / prototype. Everything runs in the browser; there is no backend yet.

## Features

- Listing cards built from data in `script.js` (edit the `PLACES` list to add or change a place)
- Live search and filter chips by city
- Save favourites with the heart button (remembered in the visitor's browser)
- Click a card for a details popup with "Show on map" and "Open in Google Maps"
- Click a card's location to move the map there
- "Near me" uses the visitor's location to sort places by distance (needs https or localhost)
- Hover and scroll animations, turned off for visitors who prefer reduced motion

## Structure

- `Thrill Tourism/index.html`: the landing page
- `Thrill Tourism/style.css`: custom styles (cards, animations, map)
- `Thrill Tourism/script.js`: listing data and all interactive behaviour
- `Thrill Tourism/image.jpg`: logo
- `Thrill Tourism/images/`: photos used on the listing cards (Unsplash)
- `index.html`: redirects to the landing page, so the site also works from the repo root (for example on GitHub Pages)

## Run locally

Open `Thrill Tourism/index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000/.
