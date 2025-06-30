#!/usr/bin/env python3
"""
Simple runner for the Results Collator
"""

import sys
import os

# Add the parent directory to the path so we can import the collator
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from collator.results_collator import main

if __name__ == "__main__":
    main() 