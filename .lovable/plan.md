

## AI-Powered Image Validation for Complaints

### What This Will Do
When a user uploads a photo with their complaint, the system will automatically analyze the image using AI (Google Gemini) to verify it matches the selected complaint category. For example:
- **Waste Management** -- checks if garbage/waste is visible in the photo
- **Road and Transport** -- checks for potholes, damaged roads, traffic issues
- **Water Supply** -- checks for water leakage, dirty water, broken pipes
- **Electricity** -- checks for broken poles, dangling wires, outages
- **Healthcare** -- checks for unsanitary conditions, medical facility issues

### No Gemini API Key Needed
This project has Lovable AI built-in, which already provides access to Google Gemini models. No separate API key is required.

### Implementation Steps

**Step 1: Create a backend function for image validation**
- New file: `supabase/functions/validate-complaint-image/index.ts`
- Accepts the uploaded image (as base64) and the selected category
- Sends it to Gemini vision model for analysis
- Returns: whether the image matches the category, a confidence score, and what was detected in the image
- Update `supabase/config.toml` to register the new function

**Step 2: Update the File Complaint page (`src/pages/FileComplaint.tsx`)**
- After a user uploads an image AND selects a category, automatically trigger AI validation
- Show a validation status on each image:
  - Green checkmark with "Verified" if the image matches the category
  - Yellow warning with "Uncertain" if the AI is not sure
  - Red cross with "Mismatch" if the image doesn't match (e.g., uploading a food photo for a pothole complaint)
- Show what the AI detected in the image (e.g., "Detected: garbage pile on roadside")
- Allow submission even with warnings (user may have valid reasons), but block clearly irrelevant images

**Step 3: Additional Features**

- **Auto-Category Suggestion**: If no category is selected yet, the AI will suggest the best category based on the uploaded image
- **Image Quality Check**: Warn users if the image is too blurry or dark to be useful
- **Smart Description Helper**: After AI analyzes the image, suggest a description snippet the user can add (e.g., "Large pothole on road surface, approximately 2 feet wide")

### Technical Details

**Backend Function (`validate-complaint-image/index.ts`)**:
- Uses Lovable AI Gateway with `google/gemini-2.5-flash` model (fast, supports image analysis)
- Sends image as base64 with a structured prompt asking for category match, confidence, and description
- Uses tool calling to extract structured JSON output (match: boolean, confidence: number, detected: string, suggestedCategory: string, suggestedDescription: string)

**Frontend Changes (`FileComplaint.tsx`)**:
- New state for validation results per image
- Validation triggers when both image and category are present
- Loading spinner during validation
- Visual badges showing validation result on each image thumbnail
- Auto-suggest category dropdown update if AI suggests a different category
- Toast notification summarizing validation result

**Config Update (`supabase/config.toml`)**:
- Add `[functions.validate-complaint-image]` with `verify_jwt = false`

