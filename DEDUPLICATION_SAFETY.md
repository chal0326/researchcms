# Document Processing Safety Measures

## Overview

Comprehensive deduplication and safety measures have been implemented in the inquisitor worker to ensure documents are only processed once and duplicate entities are properly merged.

## Safety Measures Implemented

### 1. **File-Level Deduplication**

- **Function**: `getProcessedFiles(db: D1Database)`
- **Purpose**: Queries the `entities` table's `source_file` column to get a Set of all files that have already been processed
- **Usage**: Called before creating any workflow to check if a file has already been processed

### 2. **Database-Level Entity Deduplication**

- **Function**: `deduplicateEntities(db: D1Database)`
- **Purpose**: Merges duplicate entities based on BOTH `name` AND `source_file` columns
- **Strategy**:
  - Only merges entities with the same name from the same source file
  - Keeps the entity with the most complete data (EIN first, then longest description)
  - Updates all relationships to point to the kept entity
  - Deletes duplicate entities
- **Execution**: Runs automatically after each successful extraction workflow

### 3. **Workflow Creation Protection**

#### Manual Trigger (`/trigger` endpoint)

- Checks `getProcessedFiles()` before creating workflow
- Returns `{ success: false, alreadyProcessed: true }` if file already processed
- Uses key-based workflow ID: `extract-${key}` (no timestamp)

#### Scheduled Polling (`scheduled` handler)

- Fetches processed files list once at the start
- Skips files that are already in the database
- Uses key-based workflow ID: `poll-${key}` (no timestamp for true deduplication)
- Returns stats: `{ found, triggered, skipped }`

#### Queue Handler (`queue` handler)

- Fetches processed files list once per batch
- Skips files that are already in the database
- Uses key-based workflow ID: `queue-${key}` (no timestamp)
- Logs skipped files for visibility

## Key Design Decisions

### Why Deduplicate by Name + Source File?

- **Prevents false merges**: "John Smith" in document A might be different from "John Smith" in document B
- **Preserves data integrity**: Each document's entities remain distinct unless they're truly duplicates within that document
- **Accurate tracking**: We know exactly which files mention which entities

### Why Remove Timestamps from Workflow IDs?

- **Previous behavior**: Workflow IDs included timestamps (hourly or millisecond), allowing the same file to be processed multiple times
- **New behavior**: Workflow IDs are based only on the file key, ensuring true deduplication
- **Benefit**: Even if a file is queued multiple times, only one workflow will be created

### Workflow Execution Flow

```
1. File uploaded to R2 bucket
2. Trigger (manual/scheduled/queue) checks getProcessedFiles()
3. If file already processed → Skip
4. If file not processed → Create workflow with key-based ID
5. Workflow runs extraction
6. Workflow runs deduplicateEntities() on success
7. File key is now in source_file column → Won't be processed again
```

## Database Schema Considerations

### Entities Table

- `source_file` column tracks which file(s) mention each entity
- Used for deduplication checks
- Preserved during entity merges (within same source file)

### Relationships Table

- Updated during deduplication to point to kept entities
- `source_file` column tracks relationship provenance

## Monitoring & Debugging

### Logs to Watch For

- `"Found X already-processed files in database"` - Shows how many files are being skipped
- `"Skipping already-processed file: {key}"` - Individual file skip events
- `"Found X duplicate entity name+source_file combinations"` - Deduplication activity
- `"Merging X duplicates into entity Y"` - Entity merge operations

### Metrics Returned

- **Scheduled polling**: `{ found, triggered, skipped }`
- **Deduplication**: `{ merged, deleted }`

## Testing Recommendations

1. **Test duplicate file submission**: Submit the same file multiple times via different methods (manual trigger, queue, scheduled)
2. **Verify single processing**: Check that only one workflow is created and only one set of entities is added
3. **Test entity deduplication**: Create a document with duplicate entity mentions and verify they're merged
4. **Cross-document test**: Ensure entities with the same name in different documents remain separate

## Future Enhancements

Potential improvements to consider:

- Add a `processing_status` table to track workflow states (pending, processing, completed, failed)
- Implement retry logic for failed extractions
- Add a manual "reprocess" flag to force re-extraction of specific files
- Create a cleanup job to remove orphaned relationships
