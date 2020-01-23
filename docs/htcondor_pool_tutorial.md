---
id: deployment_guide_htcondor
title: SIMPLE Framework Deployment Guide: HTCondor
sidebar_label: Deployment Guide: HTCondor
---
## Quick Introduction

This tutorial describes setting up a production ready [HTCondor](https://research.cs.wisc.edu/htcondor/) cluster using the SIMPLE Framework.

### Target Audience
The target audience for this tutorial are WLCG Site admins who wish to :
1. Try out the SIMPLE framework, a private PaaS that can deploy WLCG services on demand at their site.
1. Migrate to HTCondor from existing CREAM-CE based WLCG infrastructure at their sites. 
1. Quickly set up a test HTCondor cluster on a few nodes of their infrastructure that can subsequently be used to
   get familiar with HTCondor before they perform a full-scale migration to HTCondor.

### Overview of the Tutorial
In this tutorial, we will :
1. Select at least 4 machines (bare-metal/VM) in your infrastructure on which the SIMPLE framework and HTCondor will be set up. 
   We will refer to these as your **SIMPLE cluster** in the remainder of this tutorial
1. Prepare your SIMPLE cluster to work with the [simple_grid_puppet_module](https://forge.puppet.com/maany/simple_grid). 
1. Create a site_level_config_file.yaml (a YAML file similar to site-info.def if you are familiar with 
   [YAIM](https://twiki.cern.ch/twiki/bin/view/LCG/YaimGuide400)) that describes your SIMPLE cluster and the 
   HTCondor-CE, HTCondor-Batch(Central Manager) and HTCondor-Worker(Execute) configuration.
1. Execute the SIMPLE framework's config, pre_deploy and deploy stages to setup HTCondor on your SIMPLE cluster.
1. Run few HTCondor commands to evaluate the status of your cluster.

### Additional Notes

1. Terminal Captures for the appropriate steps described in this tutorial are available here: https://asciinema.org/~maany. 
   While the tutorial is going to include links to some of them for the steps mentioned below, please feel free to 
   check out rest of the terminal captures via the link above.
1. We are a fast-paced development community and are constantly adding new features to the framework. Therefore, please 
   feel free to check this tutorial for updates that can be useful for your future deployments.
1. Please do [get in touch](../help) with us in case any step is not clear or needs clarification. 
   We will try to maintain a Known Issues and FAQ section at the end of this tutorial that can be useful for 
   fellow site-admins who try to deploy HTCondor with SIMPLE at their sites.
1. We are always keen to get your feedback/suggestions/bug reports and feature requests. You can report them on any 
   of the [communication channels](../help)

Let's begin!

## SIMPLE cluster

The very first thing you must do is to select **at least 4 CC7 machines** at your data center where you would like 
to deploy the HTCondor cluster. One of these machines is going to serve as the **Config Master** node, while 
remainder serve as **Lightweight Component** nodes.

**Config Master or CM** and **Lightweight Component or LC** are commonly used terminologies in the SIMPLE framework. 
The Lightweight Component nodes are where lightweight components i.e. containerized grid services, HTCondor in this case, 
are deployed. The Config Master is a single node in the SIMPLE cluster that manages the deployment of the 
lightweight components i.e. containerized grid services on your Lightweight Component nodes.

**Note**: In the remainder of this tutorial **we will refer to Config Master as CM and Lightweight Components as LC**.

One of your LC nodes is going to run the HTCondor-CE, another one of your LC nodes will run the HTCondor Batch 
while the rest of your LC nodes are going to run HTCondor Workers. The criterion for selecting nodes for each type of 
service is listed in the next subsection below.

**Note** : It is possible to deploy HTCondor Submitters to **support the local users with SIMPLE** as well. If you foresee this use-case,
please [get in touch](../help) to learn more about it. We are still developing/testing this use case with our early adopters. 
Will be rolling out the official instructions for local user support soon. In the meantime, we are happy to provide you details
on what we have and collaborate to tailor the local users use-case as per your requirements. 


### Hardware Specifications

You might be able to operate slightly below the requirements mentioned below. 
In the example, for instance, our OpenStack nodes do not exactly meet the recommended hardware specifications. 
However, since it is just a test cluster, we are able to demonstrate the framework with the slightly less powerful resources. 
In real production examples, we recommend that you ensure your nodes meet the recommended requirements. 
It is difficult to predict the performance of the system otherwise.

#### For small or test HTCondor SIMPLE cluster (~ 10 nodes)
The recommended requirements for the CM and LC nodes for your HTCondor SIMPLE cluster are as follows:

| Node Type | HTCondor Role   | # CPU Cores | RAM(GB)                                  | Swap(GB) | Disk(GB) -  Root Filesystem                |
|-----------|-----------------|-------------|------------------------------------------|----------|--------------------------------------------|
| CM        | N/A             | 2           | 2*#cores (puppetserver)                  | 1        | 12(image) + 1(puppetserver)                |
| LC        | HTCondor CE     | 1           | 2(swarm) + 0.1(HTCondor) + 1 (misc)      | 1        | 3(docker) + 5(image)                       |
| LC        | HTCondor Batch  | 1           | 2(swarm) + 0.1(HTCondor) + 1 (misc)      | 1        | 3(docker) + 5(image)                       |
| LC        | HTCondor Worker | 1           | 2(swarm) + 2*#cores(HTCondor) + 1 (misc) | 3*#cores | 3(docker) + 5(image) + 10*#cores(HTCondor) |

#### For larger (>10 nodes) or production HTCondor SIMPLE Cluster

| Node Type | HTCondor Role   | # CPU Cores | RAM(GB)                                  | Swap(GB) | Disk(GB) - Root Filesystem                 |
|-----------|-----------------|-------------|------------------------------------------|----------|--------------------------------------------|
| CM        | N/A             | 4           | 2*#cores (puppetserver) + 2(misc)        | 2        | 12(image) + 2(puppetserver)                |
| LC        | HTCondor CE     | 1           | 8(swarm) + 0.1(HTCondor) + 1 (misc)      | 1        | 3(docker) + 5(image)                       |
| LC        | HTCondor Batch  | 1           | 8(swarm) + 0.1(HTCondor) + 1 (misc)      | 1        | 3(docker) + 5(image)                       |
| LC        | HTCondor Worker | 8           | 8(swarm) + 2*#cores(HTCondor) + 1 (misc) | 3*#cores | 3(docker) + 5(image) + 10*#cores(HTCondor) |

#### Specs for Example HTCondor SIMPLE cluster on CERN OpenStack


| Node Type | FQDN                     | IP address      | HTCondor Role | #cores | RAM(GB) | Swap(GB) | Disk(GB) - Root Filesystem |
|-----------|--------------------------|-----------------|---------------|--------|---------|----------|----------------------------|
| CM        | simple-condor-cm.cern.ch | 137.138.53.69   | N/A           | 2      | 4       | 1        | 20                         |
| LC        | simple-lc-node0.cern.ch  | 188.185.115.228 | CE            | 2      | 4       | 1        | 20                         |
| LC        | simple-lc-node1.cern.ch  | 188.185.118.59  | Batch         | 2      | 4       | 1        | 20                         |
| LC        | simple-lc-node2.cern.ch  | 188.185.112.73  | WN            | 4      | 8       | 12       | 60                         |
| LC        | simple-lc-node3.cern.ch  | 188.185.78.0    | WN            | 4      | 8       | 12       | 60                         |



## Preparation of Nodes
1. Pick a config master node in your infrastructure. We will refer it as CM in the rest of the document. All the other nodes in your infrastructure on which you want to run grid services configured through the SIMPLE Grid framework are lightweight_component nodes of LC nodes.

1. Install puppetserver, puppet-agent (Puppet 5) on your CM node. For CentOS7 distributions, the commands would be:
    ```
    rpm -ivh https://yum.puppetlabs.com/puppet5/puppet5-release-el-7.noarch.rpm
    yum -y install puppetserver puppet-agent
    ```

1. Install puppet-agent (Puppet 5) on all of your LC nodes. For CC7, the commands are:
    ```
    rpm -ivh https://yum.puppetlabs.com/puppet5/puppet5-release-el-7.noarch.rpm
    yum install puppet-agent
    ```

## Installation of Central Configuration Manager i.e. Simple Grid Puppet Module

1. Verify that puppet is installed 
    
    ```$> puppet --version ```
    
1. Download the [simple grid puppet module](https://forge.puppet.com/maany/simple_grid) on all of your nodes inside /etc/puppetlabs/code/environments/production/modules/
    
    ```
    puppet module install maany-simple_grid
    ```

Note: Once the module has been released on Puppet Forge, you can use ```puppet module install maany/simple-grid``` to automatically download and install the puppet module.

## Preparing a site level configuration file.

1. On the CM node, you can use the command below to generate a sample site level configuration file for you at /etc/simple_grid/site_config/site_level_configuration_file

    ```
    puppet apply -e 'class{"simple_grid::install::config_master::simple_installer::create_sample_site_level_config_file":}'
    
    ```

1. Edit the site level configuration file to describe your infrastructure and the components you want to deploy. We are working on a in-depth tutorial on how to write a site level config file. In the meantime, please reach out to us via any of the communication channels mentioned in the footer of the website to learn more.
1. Open all browser meta-info. Declare runtime variables.
1. CVMFS proxy 
1. Host certificate need to be ready.
## Simple Installer for CM
After writing the site level configuration file, run the simple installer on the CM node using to validate your site level confiuration file and install/configure various components of the SIMPLE framework on CM:
```
puppet apply --modulepath /etc/puppetlabs/code/environments/production/modules -e 'class{"simple_grid::install::config_master::simple_installer":}'
```
If there are errors related to the site level configuration file, please make the corrections and re-run the command until it executes successfully or get in touch with us to help debug the file.

## Simple Installer for LC's
On your LC nodes, you have to connect puppet agents to the puppet server running on the CM node. To do so and also configure the SIMPLE Grid Framework on the LC nodes, run the following command after replacing the 'fqdn of your CM node' with the correct fqdn of your CM node:

```
puppet apply --modulepath /etc/puppetlabs/code/environments/production/modules -e "class {'simple_grid::install::lightweight_component::simple_installer':puppet_master => 'fqdn of your CM node'}"
```

## Signing certificate requests from LC's on CM

On your CM node, see the certificate requests from LC's using:
 
```
puppet cert show -all
```

And sign the certificate requests from the LC nodes using

```
puppet cert sign --all
```

## Big Red button
Then on the CM node, to execute the pre_deploy stage of the framework, run
```
puppet agent -t
```
Continue to the deploy stage by repeating the command again.

```
puppet agent -t
```

## Known Issues

## FAQs 


