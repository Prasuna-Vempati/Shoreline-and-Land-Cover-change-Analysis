# Shoreline-and-Land-Cover-change-Analysis
This repository contains code for analyzing land cover and shoreline changes using satellite imagery. It uses Google Earth Engine (GEE) to process and visualize satellite data, compute land cover classification, shoreline change, and evaluate environmental changes over time.

Code 1: Land Cover Classification (2018)
This script processes Sentinel-2 imagery for the year 2018 and performs land cover classification using various classification algorithms (Random Forest, Naive Bayes, and CART). The script performs the following tasks:
- Filters Sentinel-2 images based on cloud coverage and date range.
- Selects relevant bands for classification.
- Merges training datasets for different land cover types (vegetation, built-up, barren land, water).
- Trains three classification models: Random Forest, Naive Bayes, and CART.
- Computes confusion matrices to assess model accuracy.
- Visualizes the classification results and displays a chart showing land cover distribution.
- Generates a custom legend for classification visualization.

Code 2: Shoreline Change Analysis (1990-2024)
This script analyzes coastal zone changes over time by processing Landsat imagery from 1990 to 2024. It performs the following tasks:
- Filters Landsat imagery based on year and region of interest (ROI).
- Applies cloud masking for different Landsat satellites (Landsat 4-5 and Landsat 8-9).
- Creates yearly composites for each satellite image.
- Computes the Normalized Difference Water Index (NDWI) for detecting water bodies.
- Classifies areas as land or water based on NDWI values.
- Visualizes shoreline changes across years and displays a legend for the coastline year.
- Calculates coastline area for each year and generates a chart showing the progression of shoreline changes.
