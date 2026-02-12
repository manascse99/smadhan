

## Full Satisfaction Survey Form for Resolved Complaints

### What Changes

When a complaint is marked as "Resolved", the user who filed it will see a "Rate Experience" button. Clicking it will open a **full-page dialog form** (instead of the current small inline card) with the following fields:

### Survey Form Fields

1. **Overall Satisfaction** - 5-star rating (required)
2. **Resolution Speed** - How satisfied with the time taken? (1-5 scale with labels: Very Slow, Slow, Average, Fast, Very Fast)
3. **Staff Behavior** - How was the officer/staff behavior? (1-5 scale: Very Poor, Poor, Average, Good, Excellent)
4. **Resolution Quality** - Was the problem actually fixed properly? (Yes / Partially / No radio buttons)
5. **Would You Recommend** - Would you recommend this platform to others? (Yes / Maybe / No)
6. **Detailed Feedback** - Text area for additional comments (optional, max 500 chars)
7. **Improvement Suggestions** - What could be improved? (optional, max 300 chars)

### How It Works

- User sees "Rate Experience" button on resolved complaint cards in their Dashboard
- Clicking opens a full Dialog with the survey form
- All ratings are required except the two text fields
- On submit, data is saved to a new `satisfaction_surveys` table in the database
- The `satisfaction_rating` on the `complaints` table is also updated with the overall rating
- Success toast shown and the survey section updates to show "Feedback Submitted" with the star rating
- Admin can view this feedback in the complaint management page

### Database Changes

**New table: `satisfaction_surveys`**
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| complaint_id | text | Links to complaints table |
| user_id | uuid | Who submitted |
| overall_rating | integer | 1-5 |
| speed_rating | integer | 1-5 |
| staff_rating | integer | 1-5 |
| resolution_quality | text | 'yes', 'partially', 'no' |
| would_recommend | text | 'yes', 'maybe', 'no' |
| feedback | text | Optional comments |
| suggestions | text | Optional suggestions |
| created_at | timestamptz | Auto |

**RLS Policies:**
- Users can insert their own surveys (user_id = auth.uid())
- Users can view their own surveys
- Admins/officers can view all surveys

### Technical Steps

1. **Create `satisfaction_surveys` table** via database migration with RLS policies
2. **Replace `SatisfactionSurvey` component** with a full Dialog-based form containing all fields above
3. **Update `ComplaintCard`** to open the new survey dialog and show submitted feedback summary
4. **Update `ManageComplaint` (admin page)** to display detailed survey responses for resolved complaints

### Files Modified
- `src/components/SatisfactionSurvey.tsx` - Complete rewrite with full form in a Dialog
- `src/components/ComplaintCard.tsx` - Minor update to pass data to new survey
- `src/pages/ManageComplaint.tsx` - Show survey results to admin

### Files Created
- Database migration for `satisfaction_surveys` table

