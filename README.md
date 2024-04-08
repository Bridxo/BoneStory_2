<p align="center">

  <h1 align="center">BoneStory: Visual Storytelling in 3D Virtual Surgical Planning</h1>
  <h2 align="center">CGI 2024 Conference Proceedings</h2>
  <div align="center">
    Demo Video will be updated soon
<!--     <img src="DragGAN.gif", width="600"> -->
  </div>
  
## Abstract
3D Virtual Surgical Planning (VSP) for bone fractures in trauma- and orthopedic surgery has been introduced for the preoperative stage to visualize patients' medical images in a 3D rendered model to support surgeons in simulating and planning surgical procedures. However, 3D VSP is limited by showing only the final planned outcome and lacking the option to store intermediate steps and alternative strategies, which are crucial for explaining surgical procedures in detail and preparing fallback plans. We propose \emph{BoneStory}, a web-based visual storytelling tool for 3D VSP to alleviate these limitations and enhance the visual representation in surgical planning. \emph{BoneStory} allows experts to create and manage multiple plans through an interactive provenance tree consisting of essential user interactions for virtual fracture reduction planning. Furthermore, we simplify this provenance tree by hierarchical grouping and action type filtering to track key interactions faster. We evaluated the usability of our features in a user study where we asked four medical experts in trauma surgery to perform surgical planning and create visual stories with \emph{BoneStory}. Our results indicate that \emph{BoneStory} effectively aids the experts in authoring visual stories and provenance tracking. Hierarchical grouping was found to increase the efficiency of tracking key actions, being about 45\% faster than methods without grouping.

## Web Demos

[![Open in OpenXLab](https://cdn-static.openxlab.org.cn/app-center/openxlab_app.svg)](https://radiant-voyage-171301.web.app/)


## Run BoneStory
Before you build the docker container, make sure you have cloned this repo.
```sh
cd bonestory
docker build -t bonestory .
docker run -p 8080:80 bonestory
```
From Chrome/Edge 
```
https://localhost:8080
```

## License

MIT

## BibTeX

```bibtex
TBD
```
