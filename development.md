# Development Plan - Akordeons.lv Static Site Migration

This document outlines the step-by-step implementation plan for migrating akordeons.lv to a static GitHub Pages site.

## Phase 1: Site Analysis and Asset Collection

### Step 1.1: Crawl Old Site
- [ ] Fetch HTML content from all pages (Ieraksti, Evita, Kontakti)
- [ ] Extract all images and save to `old_site/images/`
- [ ] Extract all MP3 files and save to `old_site/mp3/`
- [ ] Extract textual content and save to `old_site/content/`
- [ ] Identify analytics tracking code
- [ ] Document site structure and navigation

**Test**: Verify all assets are downloaded and organized in `old_site/` folder

---

## Phase 2: Project Foundation

### Step 2.1: Create Project Structure
- [ ] Create folder structure in `build/`:
  - `build/css/` - Stylesheets
  - `build/js/` - JavaScript files
  - `build/images/` - Image assets
  - `build/mp3/` - MP3 files (organized by playlists)
  - `build/data/` - JSON data files (content, playlists, videos)
- [ ] Create `build/colors.css` for color scheme definitions
- [ ] Create base `build/index.html` structure

**Test**: Verify folder structure exists

### Step 2.2: Set Up Color Scheme
- [ ] Define color palette in `build/css/colors.css`
- [ ] Ensure WCAG 2.1 AA compliance
- [ ] Define light and dark mode color variables
- [ ] Test color contrast ratios

**Test**: Open colors.css and verify color definitions

### Step 2.3: Set Up Bootstrap (if needed)
- [ ] Download Bootstrap CSS (pinned version)
- [ ] Add to `build/css/` or use CDN with version pinning
- [ ] Test Bootstrap grid system

**Test**: Create test HTML page with Bootstrap grid

---

## Phase 3: Content Management

### Step 3.1: Create Multilingual Content JSON Files
- [ ] Create `build/data/content-lv.json` (Latvian - default)
- [ ] Create `build/data/content-ru.json` (Russian)
- [ ] Create `build/data/content-en.json` (English)
- [ ] Extract and structure content from old site:
  - Navigation items
  - Page titles and content
  - Contact information
  - Meta descriptions
- [ ] Add placeholder content for missing translations

**Test**: Load JSON files and verify structure

### Step 3.2: Create Language Switcher Component
- [ ] Create `build/js/language.js` for language switching
- [ ] Implement localStorage for language preference
- [ ] Create language switcher UI component
- [ ] Test language switching on all pages

**Test**: Switch languages and verify content updates

---

## Phase 4: Base HTML Structure

### Step 4.1: Create Base HTML Template
- [ ] Create `build/index.html` with semantic HTML5 structure
- [ ] Add header with logo, navigation, language switcher
- [ ] Add footer with contact info
- [ ] Ensure contact info appears at top and bottom
- [ ] Add meta tags (viewport, charset, description)
- [ ] Link CSS and JS files

**Test**: Open index.html in browser, verify structure

### Step 4.2: Create Navigation Component
- [ ] Build responsive navigation menu
- [ ] Add mobile hamburger menu
- [ ] Implement active page highlighting
- [ ] Test navigation on all viewport sizes

**Test**: Navigate between pages, test mobile menu

### Step 4.3: Create Header and Footer Components
- [ ] Build header with contact info (phone, email)
- [ ] Build footer with contact info
- [ ] Add dark mode toggle button to header
- [ ] Ensure consistent styling

**Test**: Verify header/footer appear on all pages

---

## Phase 5: Dark Mode Implementation

### Step 5.1: Implement Dark Mode CSS
- [ ] Create `build/css/dark-mode.css`
- [ ] Define CSS variables for light/dark themes
- [ ] Implement automatic dark mode (prefers-color-scheme)
- [ ] Test automatic switching

**Test**: Change system theme, verify site adapts

### Step 5.2: Implement Manual Dark Mode Toggle
- [ ] Create `build/js/dark-mode.js`
- [ ] Add toggle button to header
- [ ] Implement localStorage for preference
- [ ] Sync with system preference
- [ ] Test toggle functionality

**Test**: Click toggle, verify mode switches and persists

---

## Phase 6: Home Page

### Step 6.1: Create Home Page Content
- [ ] Design home page layout
- [ ] Add hero section
- [ ] Add introduction text
- [ ] Link content from JSON files
- [ ] Test multilingual content

**Test**: Load home page, switch languages, verify content

---

## Phase 7: MP3 Player and Playlists

### Step 7.1: Organize MP3 Files
- [ ] Copy MP3 files from `new_site_assets/mp3/` to `build/mp3/`
- [ ] Organize into playlist folders (playlist1, playlist2, etc.)
- [ ] Rename files to ASCII-only (replace spaces with underscores)
- [ ] Verify file sizes (GitHub Pages limits)

**Test**: Verify all MP3 files are accessible

### Step 7.2: Create Playlist JSON Files
- [ ] Analyze MP3 files and create playlists
- [ ] Create JSON files for each playlist (playlist1.json, playlist2.json, etc.)
- [ ] Extract or estimate track durations
- [ ] Add titles and descriptions
- [ ] Structure according to specification

**Test**: Load playlist JSON files, verify structure

### Step 7.3: Build HTML5 MP3 Player Component
- [ ] Create `build/js/mp3-player.js`
- [ ] Implement play, pause, stop, volume controls
- [ ] Implement auto-advance to next track
- [ ] Implement single-player-at-a-time (stop others when new starts)
- [ ] Create player UI component
- [ ] Test all player functions

**Test**: Play tracks, test controls, verify auto-advance works

### Step 7.4: Create Music/Playlists Page
- [ ] Create `build/music.html` (or `build/music/index.html`)
- [ ] Load playlist JSON files
- [ ] Render playlists with players
- [ ] Add descriptions and metadata
- [ ] Test responsive design

**Test**: Load music page, play tracks, test on mobile

---

## Phase 8: Videos Page

### Step 8.1: Create Videos JSON File
- [ ] Create `build/data/videos.json`
- [ ] Add the two initial YouTube videos:
  - HvWA7Sfsrco
  - rRzlQHQSlSI
- [ ] Add titles and descriptions
- [ ] Structure according to specification

**Test**: Load videos.json, verify structure

### Step 8.2: Create Videos Page
- [ ] Create `build/videos.html` (or `build/videos/index.html`)
- [ ] Load videos.json
- [ ] Render YouTube embeds
- [ ] Add responsive video containers
- [ ] Test video playback

**Test**: Load videos page, play videos, test on mobile

---

## Phase 9: Additional Pages

### Step 9.1: Create About/Biography Page (if needed)
- [ ] Determine if needed from old site analysis
- [ ] Create `build/about.html` or `build/biography.html`
- [ ] Extract content from old site
- [ ] Add to navigation
- [ ] Test multilingual content

**Test**: Load about page, verify content

### Step 9.2: Create Contact Page (if needed)
- [ ] Determine if needed (contact info already in header/footer)
- [ ] Create `build/contact.html` if separate page needed
- [ ] Add contact form or information
- [ ] Add to navigation

**Test**: Load contact page, verify information

---

## Phase 10: Responsive Design and Styling

### Step 10.1: Implement Responsive Design
- [ ] Test all pages on mobile viewport (320px+)
- [ ] Adjust navigation for mobile
- [ ] Optimize images for mobile
- [ ] Test MP3 player on mobile
- [ ] Test video embeds on mobile
- [ ] Verify touch interactions work

**Test**: Test all pages on various screen sizes

### Step 10.2: Finalize Styling
- [ ] Apply consistent styling across all pages
- [ ] Ensure color scheme is applied everywhere
- [ ] Test dark mode on all pages
- [ ] Verify accessibility (keyboard navigation, screen readers)
- [ ] Optimize CSS (remove unused styles)

**Test**: Visual review of all pages in both light/dark modes

---

## Phase 11: Analytics

### Step 11.1: Extract Analytics from Old Site
- [ ] Identify analytics service (Google Analytics, etc.)
- [ ] Extract tracking ID/configuration
- [ ] Document analytics setup

**Test**: Verify analytics code is identified

### Step 11.2: Implement Analytics
- [ ] Add analytics tracking code to all pages
- [ ] Test tracking functionality
- [ ] Verify events are being tracked

**Test**: Check analytics dashboard for test visits

---

## Phase 12: SEO and Metadata

### Step 12.1: Generate sitemap.xml
- [ ] Create `build/sitemap.xml`
- [ ] List all pages with proper URLs
- [ ] Set update frequencies and priorities
- [ ] Validate sitemap structure

**Test**: Validate sitemap.xml with online validator

### Step 12.2: Generate robots.txt
- [ ] Create `build/robots.txt`
- [ ] Allow all crawlers
- [ ] Reference sitemap location
- [ ] Test robots.txt

**Test**: Verify robots.txt is accessible

### Step 12.3: Generate feed.rss
- [ ] Create `build/feed.rss`
- [ ] Add site metadata
- [ ] Add recent content/updates
- [ ] Validate RSS structure

**Test**: Validate RSS feed with online validator

---

## Phase 13: Final Testing and Optimization

### Step 13.1: Comprehensive Testing
- [ ] Test all pages load correctly
- [ ] Test language switching on all pages
- [ ] Test dark mode toggle on all pages
- [ ] Test MP3 players (play, pause, stop, volume, auto-advance)
- [ ] Test YouTube videos embed correctly
- [ ] Test responsive design on mobile viewport
- [ ] Test all links are relative and work correctly
- [ ] Test analytics tracking
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility

**Test**: Complete test checklist

### Step 13.2: Performance Optimization
- [ ] Optimize images (compress, appropriate formats)
- [ ] Minify CSS and JS (or ensure production versions)
- [ ] Verify all assets load efficiently
- [ ] Test page load times
- [ ] Check for broken links

**Test**: Run performance audit, verify load times

### Step 13.3: Final Review
- [ ] Review all code for comments and clarity
- [ ] Verify SOLID principles where applicable
- [ ] Check for any hardcoded values that should be configurable
- [ ] Verify all file/folder names are ASCII-only
- [ ] Verify all links are relative
- [ ] Final visual review

**Test**: Code review, visual review

---

## Commit Strategy

Each step should result in a commit that:
- Is small and focused
- Is testable
- Can be reviewed independently
- Includes meaningful commit messages

## Notes

- All file and folder names must be ASCII-only (no unicode, no spaces)
- Use underscores for spaces in file/folder names
- All links must be relative to site root
- Output goes to `/build/` folder for GitHub Pages
- Default language is Latvian (lv)
- Site URL: https://coreteameu.github.io/akordeons/


