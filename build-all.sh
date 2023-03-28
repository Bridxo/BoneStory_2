#!/bin/sh
cd provenance-core && yarn build && cd ..
cd slide-deck-visualization && yarn build && cd ..
cd provenance-tree-visualization && yarn build && cd ..