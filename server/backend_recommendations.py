# backend_recommendations.py
import json
import random

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Enable CORS for frontend communication

# --- Dummy Data for Demonstration ---
# In a real application, this data would come from a database (e.g., MongoDB, SQL)
# For simplicity, we're simulating a user's books and a larger external library.

# Simulating a user's books (fetched from the main /api/books endpoint)
# We'll use a dummy user ID for testing.
DUMMY_USER_ID = "user123"

# User's actual books (would typically be fetched from your MongoDB via another endpoint)
# For this recommendation backend, we assume these are passed or looked up
user_library_books = [
    {
        "_id": "userbook1",
        "title": "The Fault in Our Stars",
        "author": "John Green",
        "genre": "Young Adult, Romance, Contemporary",
        "description": "A love story between two teenage cancer patients.",
        "rating": 4.5,
        "totalPages": 313,
        "user": DUMMY_USER_ID
    },
    {
        "_id": "userbook2",
        "title": "Dune",
        "author": "Frank Herbert",
        "genre": "Science Fiction, Epic, Adventure",
        "description": "A saga of politics, religion, and ecology on a desert planet.",
        "rating": 4.8,
        "totalPages": 412,
        "user": DUMMY_USER_ID
    },
    {
        "_id": "userbook3",
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "genre": "Classic, Romance, Regency",
        "description": "A classic novel of manners, love, and societal expectations.",
        "rating": 4.2,
        "totalPages": 279,
        "user": DUMMY_USER_ID
    },
    {
        "_id": "userbook4",
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee",
        "genre": "Classic, Fiction, Southern Gothic",
        "description": "A novel about racial injustice in the American South.",
        "rating": 4.7,
        "totalPages": 324,
        "user": DUMMY_USER_ID
    },
]

# A larger "pool" of external books from which to draw recommendations
# In a real scenario, this would be your main book database, possibly much larger
external_books_pool = [
    {
        "id": "extbook1",
        "title": "Paper Towns",
        "author": "John Green",
        "genre": "Young Adult, Mystery, Contemporary",
        "description": "A young man embarks on a journey to find a mysterious girl.",
        "averageRating": 3.8,
        "pageCount": 305,
        "coverImageUrl": "https://placehold.co/100x150/FDF8ED/5A4434?text=Paper+Towns"
    },
    {
        "id": "extbook2",
        "title": "Children of Dune",
        "author": "Frank Herbert",
        "genre": "Science Fiction, Epic, Space Opera",
        "description": "The continuing saga of Paul Atreides' children.",
        "averageRating": 4.3,
        "pageCount": 408,
        "coverImageUrl": "https://placehold.co/100x150/FDF8ED/5A4434?text=Children+Dune"
    },
    {
        "id": "extbook3",
        "title": "Sense and Sensibility",
        "author": "Jane Austen",
        "genre": "Classic, Romance, Regency",
        "description": "Two sisters navigating love and societal pressures.",
        "averageRating": 4.1,
        "pageCount": 320,
        "coverImageUrl": "https://placehold.co/100x150/FDF8ED/5A4434?text=Sense+Sensibility"
    },
    {
        "id": "extbook4",
        "title": "1984",
        "author": "George Orwell",
        "genre": "Dystopian, Science Fiction, Political Fiction",
        "description": "A chilling vision of a totalitarian future.",
        "averageRating": 4.6,
        "pageCount": 328,
        "coverImageUrl": "https://placehold.co/100x150/FDF8ED/5A4434?text=1984"
    },
    {
        "id": "extbook5",
        "title": "The Hitchhiker's Guide to the Galaxy",
        "author": "Douglas Adams",
        "genre": "Science Fiction, Comedy, Absurdist",
        "description": "Follow Arthur Dent's misadventures after Earth is demolished.",
        "averageRating": 4.4,
        "pageCount": 193,
        "coverImageUrl": "https://placehold.co/100x150/FDF8ED/5A4434?text=Hitchhiker"
    },
    {
        "id": "extbook6",
        "title": "Eleanor Oliphant Is Completely Fine",
        "author": "Gail Honeyman",
        "genre": "Contemporary, Fiction, Humour",
        "description": "An endearing, awkward woman learns to navigate social interaction.",
        "averageRating": 4.0,
        "pageCount": 384,
        "coverImageUrl": "https://placehold.co/100x150/FDF8ED/5A4434?text=Eleanor"
    },
    {
        "id": "extbook7",
        "title": "Red, White & Royal Blue",
        "author": "Casey McQuiston",
        "genre": "Young Adult, Romance, Contemporary, LGBTQ+",
        "description": "The First Son of the United States falls for a British prince.",
        "averageRating": 4.3,
        "pageCount": 432,
        "coverImageUrl": "https://placehold.co/100x150/FDF8ED/5A4434?text=Red+White"
    },
    {
        "id": "extbook8",
        "title": "A Court of Thorns and Roses",
        "author": "Sarah J. Maas",
        "genre": "Fantasy, Romance, Young Adult",
        "description": "A huntress is dragged into a magical land of fae.",
        "averageRating": 4.2,
        "pageCount": 419,
        "coverImageUrl": "https://placehold.co/100x150/FDF8ED/5A4434?text=ACOTAR"
    },
    {
        "id": "extbook9",
        "title": "The Martian",
        "author": "Andy Weir",
        "genre": "Science Fiction, Adventure, Survival",
        "description": "An astronaut is stranded on Mars and must find a way to survive.",
        "averageRating": 4.5,
        "pageCount": 384,
        "coverImageUrl": "https://placehold.co/100x150/FDF8ED/5A4434?text=The+Martian"
    },
    {
        "id": "extbook10",
        "title": "Atomic Habits",
        "author": "James Clear",
        "genre": "Self-Help, Non-Fiction, Productivity",
        "description": "An easy and proven way to build good habits and break bad ones.",
        "averageRating": 4.7,
        "pageCount": 320,
        "coverImageUrl": "https://placehold.co/100x150/FDF8ED/5A4434?text=Atomic+Habits"
    },
    {
        "id": "extbook11",
        "title": "The Nightingale",
        "author": "Kristin Hannah",
        "genre": "Historical Fiction, War, Romance",
        "description": "Two sisters' struggle for survival, love, and freedom during WWII.",
        "averageRating": 4.6,
        "pageCount": 448,
        "coverImageUrl": "https://placehold.co/100x150/FDF8ED/5A4434?text=Nightingale"
    },
    {
        "id": "extbook12",
        "title": "Circe",
        "author": "Madeline Miller",
        "genre": "Fantasy, Mythology, Historical Fiction",
        "description": "A powerful and reimagined story of the goddess Circe.",
        "averageRating": 4.5,
        "pageCount": 393,
        "coverImageUrl": "https://placehold.co/100x150/FDF8ED/5A4434?text=Circe"
    },
    {
        "id": "extbook13",
        "title": "The Chronicles of Narnia: The Lion, the Witch and the Wardrobe",
        "author": "C.S. Lewis",
        "genre": "Fantasy, Classic, Children's",
        "description": "Four children discover a magical world through a wardrobe.",
        "averageRating": 4.3,
        "pageCount": 206,
        "coverImageUrl": "https://placehold.co/100x150/FDF8ED/5A4434?text=Narnia"
    },
    {
        "id": "extbook14",
        "title": "Six of Crows",
        "author": "Leigh Bardugo",
        "genre": "Young Adult, Fantasy, Heist",
        "description": "A band of six dangerous outcasts attempts a daring heist.",
        "averageRating": 4.5,
        "pageCount": 465,
        "coverImageUrl": "https://placehold.co/100x150/FDF8ED/5A4434?text=Six+Crows"
    },
]

# --- Recommendation Logic (Server-side) ---

def calculate_backend_similarity_score(seed_book, candidate_book):
    """
    Calculates a similarity score between a seed book and a candidate book.
    Higher score means more similar.

    This is a content-based similarity, focusing on shared characteristics.
    Weights are adjusted to prioritize genre.
    """
    score = 0

    # Normalize genres and authors for comparison
    genres_seed = [g.strip().lower() for g in (seed_book.get("genre") or seed_book.get("categories", [])).split(',') if g.strip()]
    authors_seed = [a.strip().lower() for a in (seed_book.get("author") or ",".join(seed_book.get("authors", []))).split(',') if a.strip()]
    description_seed = (seed_book.get("description") or "").lower()
    rating_seed = seed_book.get("rating") or seed_book.get("averageRating") or 0
    pages_seed = seed_book.get("totalPages") or seed_book.get("pageCount") or 0

    genres_candidate = [g.strip().lower() for g in (candidate_book.get("genre") or candidate_book.get("categories", [])).split(',') if g.strip()]
    authors_candidate = [a.strip().lower() for a in (candidate_book.get("author") or ",".join(candidate_book.get("authors", []))).split(',') if a.strip()]
    description_candidate = (candidate_book.get("description") or "").lower()
    rating_candidate = candidate_book.get("averageRating") or 0
    pages_candidate = candidate_book.get("pageCount") or 0

    # 1. Genre Similarity (HIGH WEIGHT - to fix Sci-Fi for YA Romance)
    common_genres = set(genres_seed).intersection(genres_candidate)
    score += len(common_genres) * 30 # Significantly increased weight

    # Check for specific strong mismatches (e.g., if YA Romance is a primary genre in seed but hard Sci-Fi in candidate)
    # This is a simple rule, more complex rules could be learned.
    if 'romance' in genres_seed and 'science fiction' in genres_candidate and 'romance' not in genres_candidate:
        score -= 50 # Penalize strong genre divergence if romance is key for seed

    if 'young adult' in genres_seed and 'adult' in genres_candidate and 'young adult' not in genres_candidate:
        score -= 20 # Penalize if YA is key for seed but candidate is purely adult

    # 2. Author Similarity (MEDIUM-HIGH WEIGHT)
    common_authors = set(authors_seed).intersection(authors_candidate)
    score += len(common_authors) * 15 # Increased weight

    # 3. Description Keyword Similarity (MODERATE WEIGHT)
    # Filter out very common words
    stop_words = set(["a", "an", "the", "and", "or", "but", "is", "are", "on", "in", "for", "with", "of", "to", "from", "about"])
    keywords_seed = set(word for word in description_seed.split() if len(word) > 3 and word not in stop_words)
    keywords_candidate = set(word for word in description_candidate.split() if len(word) > 3 and word not in stop_words)
    common_keywords = keywords_seed.intersection(keywords_candidate)
    score += len(common_keywords) * 1 # Maintain moderate weight

    # 4. Rating Similarity (MODERATE WEIGHT)
    if rating_seed > 0 and rating_candidate > 0:
        rating_diff = abs(rating_seed - rating_candidate)
        if rating_diff <= 0.5:
            score += 8  # High bonus for very close ratings
        elif rating_diff <= 1.0:
            score += 4  # Moderate bonus
        elif rating_diff <= 2.0:
            score += 1  # Small bonus

    # 5. Page Count Similarity (LOW WEIGHT)
    if pages_seed > 0 and pages_candidate > 0:
        page_ratio = min(pages_seed, pages_candidate) / max(pages_seed, pages_candidate)
        if page_ratio >= 0.9: # Very similar length
            score += 2
        elif page_ratio >= 0.7: # Reasonably similar length
            score += 1

    return max(0, score) # Ensure score doesn't go below zero

# --- API Endpoint ---
@app.route('/api/books/recommendations', methods=['POST']) # Changed method to POST
def get_recommendations():
    """
    Provides book recommendations based on user's reading list.
    If a specific book ID is provided, it recommends books similar to that book.
    Otherwise, it recommends based on the user's overall favorite genres/authors.
    """
    # In a real app, you'd get the user ID from the authentication token
    # For this dummy example, we'll assume DUMMY_USER_ID is active
    # The token is sent in the header, not used directly as user_id here.
    # For demonstration, we'll continue with the DUMMY_USER_ID for filtering user's books.
    user_id = DUMMY_USER_ID

    # Get data from the POST request body
    request_data = request.get_json()
    my_books_from_frontend = request_data.get('myBooks', [])
    seed_book_from_frontend = request_data.get('seedBook')

    # Use the my_books_from_frontend to filter out books already in the user's list
    user_books_titles = {book['title'].lower() for book in my_books_from_frontend}


    candidate_books = []
    if seed_book_from_frontend:
        # If a seed book is provided, find it and recommend similar books
        seed_book = seed_book_from_frontend
        
        for ext_book in external_books_pool:
            # Exclude the seed book itself (by title and author) and books already in user's library
            if (ext_book['title'].lower() == seed_book['title'].lower() and
                ext_book['author'].lower() == seed_book['author'].lower()) or \
               ext_book['title'].lower() in user_books_titles:
                continue

            similarity = calculate_backend_similarity_score(seed_book, ext_book)
            if similarity > 0: # Only add if there's some similarity
                candidate_books.append({**ext_book, "similarityScore": similarity})

        # Sort by similarity score in descending order
        candidate_books.sort(key=lambda x: x['similarityScore'], reverse=True)
        # Limit to top N recommendations
        return jsonify(candidate_books[:10]) # Return top 10 relevant recommendations
    else:
        # General recommendations based on user's overall preferences (most read genres/authors)
        if not my_books_from_frontend:
            # If user has no books, recommend popular or diverse books
            random.shuffle(external_books_pool)
            # Add a dummy similarity score for consistent frontend sorting
            return jsonify([{**book, "similarityScore": random.randint(1, 100)} for book in external_books_pool[:10]])

        # Get top genres from user's library passed from frontend
        genre_counts = {}
        for book in my_books_from_frontend:
            genres = [g.strip().lower() for g in (book.get("genre") or book.get("categories", [])).split(',') if g.strip()]
            for genre in genres:
                genre_counts[genre] = genre_counts.get(genre, 0) + 1

        sorted_genres = sorted(genre_counts.items(), key=lambda item: item[1], reverse=True)
        top_genres = [g for g, count in sorted_genres[:3]] # Top 3 genres

        recommended_books_scored = []
        for ext_book in external_books_pool:
            if ext_book['title'].lower() in user_books_titles:
                continue

            # Calculate a score based on how well it matches top genres
            ext_genres = [g.strip().lower() for g in (ext_book.get("genre") or ext_book.get("categories", [])).split(',') if g.strip()]
            genre_match_score = sum(1 for tg in top_genres if tg in ext_genres) * 10 # Strong weight

            # Add a bit of randomness to diversify general recommendations
            random_bonus = random.randint(1, 5) # Small random score
            final_score = genre_match_score + random_bonus

            if final_score > 0:
                recommended_books_scored.append({**ext_book, "similarityScore": final_score})

        recommended_books_scored.sort(key=lambda x: x['similarityScore'], reverse=True)
        return jsonify(recommended_books_scored[:10])


if __name__ == '__main__':
    app.run(debug=True, port=5001) # Changed port to 5001
