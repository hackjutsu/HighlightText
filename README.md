# Chrome Extension: Highlight Text

## Overview

This is a simple Chrome extension that allows you to highlight text on a webpage.

![alt text](screenshot.jpg)

## Features
- Highlight text with different colors
- Save highlights across browser sessions
- Remove highlights with a single click
- Multiple color options

## Limitations
The highlight storage and reload feature works on most websites but has some limitations:

### Works on:
- Static web pages
- Blog posts
- Documentation sites
- News articles
- Most content-based websites

### Limited or No Support:
- GitHub README files (due to Content Security Policy)
- Single Page Applications (SPAs) with dynamic routing
- Sites with strict Content Security Policies (CSPs)
- Sites that dynamically load or modify content
- PDF files viewed in browser

### Technical Notes:
- Highlights are stored based on exact text matching and DOM element paths
- Page modifications or content updates may prevent highlights from being restored
- Some websites may block content modification due to security policies

## How to install

1. Clone the repository
2. Go to chrome://extensions/
3. Click on "Load unpacked"
4. Select the "highlight-text" folder
5. Enjoy!


