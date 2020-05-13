---
title: SIMPLE YAML compiler Web UI Deployment Guide
author: Boris Vasilev
authorURL: https://github.com/boris-vasilev
---

# Backend deployment


Backend repository can be found [here](https://github.com/simple-framework/simple_web_compiler_backend).

Frontend repository can be found [here](https://github.com/simple-framework/simple_web_compiler_frontend).

### How to deploy to OpenShift
 1) Go to https://openshift.cern.ch/console/catalog
 
 2) Select Python from the list of options
 
 <img src="https://user-images.githubusercontent.com/12242041/81801353-32a45c80-950c-11ea-86d5-21b907ef688a.png"/>

 
 3) Select your project, set application name and select the repository. **Supported Python version is 2.7.** 

  <img src="https://user-images.githubusercontent.com/12242041/81801357-346e2000-950c-11ea-81bb-04a58a45a4d4.png"/>

 4) Create a route to the backend service with secondary hostname
    <img src="https://user-images.githubusercontent.com/12242041/81802084-5916c780-950d-11ea-888d-dc99c89f73a6.png"/>

5) Expose route to the Internet using `oc annotate route <ROUTE NAME> router.cern.ch/network-visibility=Internet`
 
 6) (Optional) Add health-check to the backend deployment.

 
### Available endpoints
   * `/versions` - `GET` list of installed compiler versions
   * `/compile` - `POST` site-level config file to be compiled/augmented
       ```javascript
     // Request
     {
         "version": "v1.0.6",
         "site_conf": (binary)
     }
     
     // Response (success)
     {
         "augmented_conf": "...",
         "schema": "..."
     }
     
     // Response (failure)
     {
         "Input File": "<site-level conf>",
         "error": "<error traceback>",
         "file_name1": "...",
         "file_name2": "...",
         "file_name3": "...",
         ...
     }
     ```
   * `/health` - `GET` health check endpoint
   
### Installing new compiler versions

In order to install a new compiler simply download it from the SIMPLE Grid YAML compiler package page in PyPi [here](https://pypi.org/project/simple-grid-yaml-compiler/#history) and extract it inside the `compilers` directory.
The backend will take care of picking up the installed compilers and providing a list of available versions to the frontend.


# Frontend deployment

### How to deploy to OpenShift
 0) Download the OKD client [oc](https://www.okd.io/download.html).
 1) Execute the `oc login` command from the OpenShift dashboard.
 2) Select project using `oc project`.
 3) Deploy app  by executing `npx simple-nodeshift --strictSSL=false --dockerImage=nodeshift/ubi8-s2i-web-app --imageTag=latest --expose` inside of the project root directory. Used a [fork](https://www.npmjs.com/package/simple-nodeshift) of [nodeshift](https://github.com/nodeshift/nodeshift).
 4) Expose route to the Internet using `oc annotate route simple-web-compiler-frontend router.cern.ch/network-visibility=Internet`

  **WARNING:** If the frontend works but when uploading a file it hangs check that the backend route is also exposed and the hosts are not conflicting.