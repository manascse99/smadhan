

# Duplicate Complaint Detection System

## Overview
When a user files a new complaint, the system will use AI to compare the uploaded image and location against existing complaints in the same category and area. If a duplicate is found, the user is redirected to the existing complaint where they can upvote it instead of creating a duplicate.

## How It Works

```text
User fills complaint form
        |
        v
Clicks "Verify Images" 
        |
        v
+---------------------------+
| Check for duplicates      |
| (AI image + location      |
|  similarity analysis)     |
+---------------------------+
        |
   +---------+---------+
   |                   |
No duplicates      Duplicate found
   |                   |
   v                   v
Normal submit     Show duplicate alert
flow continues    with existing complaint
                       |
                       v
                  "View & Upvote" button
                  redirects to existing
                  complaint on dashboard
```

## Implementation Steps

### Step 1: Create the Duplicate Detection Edge Function
A new backend function `detect-duplicate-complaint` that:
- Receives the uploaded image (Base64), category, location (lat/lng), and description
- Queries the database for existing complaints in the same category within a ~2km radius
- Sends the new image + existing complaint images to Lovable AI (`google/gemini-2.5-flash`) asking it to compare visual similarity
- Returns either "no duplicate" or the matching complaint ID, title, and similarity score

### Step 2: Update the Complaint Filing Page
Modify `FileComplaint.tsx` to:
- Add a "Check for Duplicates" step that runs automatically during image verification
- If a duplicate is detected, show a prominent alert card with:
  - The existing complaint's title, category, location, and upvote count
  - A "View & Upvote This Complaint" button that navigates to the complaint feed/dashboard
  - A "File Anyway" option for cases where the user believes it's a different issue
- If no duplicate is found, proceed with the normal submission flow

### Step 3: Update `supabase/config.toml`
Register the new edge function with `verify_jwt = false` (auth handled in code).

## Technical Details

### Duplicate Detection Logic
1. **Location filter**: Query complaints table for same `category` within ~2km using lat/lng bounding box (no PostGIS needed -- simple math filter)
2. **Image comparison**: Send the new image alongside up to 3 nearby complaint images to the AI model with a prompt like: "Compare these images. Are they showing the same civic issue at the same location? Return a JSON with `isDuplicate` (boolean), `confidence` (0-1), and `matchingReason` (string)."
3. **Text similarity**: The AI prompt also includes the title/description of both complaints for additional context
4. **Threshold**: Only flag as duplicate if confidence >= 0.75

### UI Flow for Duplicate Found
- A yellow/orange alert card appears below the verification section
- Shows: "Similar complaint already exists!" with complaint details
- Two action buttons: "View & Upvote" (primary) and "Submit Anyway" (secondary/outline)
- "View & Upvote" navigates to `/track-complaint?id=EXISTING_ID`

### Edge Cases
- If the user has no images, skip image comparison and only do location + text similarity
- If the AI gateway is unavailable, skip duplicate check silently (don't block submission)
- Limit nearby complaint search to last 90 days to avoid stale matches
- Only check against non-resolved complaints

