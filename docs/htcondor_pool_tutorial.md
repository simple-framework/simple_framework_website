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



### Pre-Requisites

#### Host Certificates
For your HTCondorCE to work, you will have to pre-arrange **host certificates (hostkey.pem and hostcert.pem)** from a trusted CA for your HTCondorCE LC node.
On your CM, you will then create the following directory:

**Note**: The following commands are executed on the CM

```shell session
mkdir -p /etc/simple_grid/host_certificates/$fqdn_of_you_ce
``` 
In our example SIMPLE cluster, the HTCondorCE node is simple-lc-node0.cern.ch. Therefore, the above command would look as follows:
```shell script
mkdir -p /etc/simple_grid/host_certificates/simple-lc-node0.cern.ch
```
Inside this newly created directory, place the hostkey.pem and hostcert.pem for your CE. 
You can optionally change the permissions on your hostkey.pem and hostcert.pem as follows

```shell script
chmod 644 /etc/simple_grid/host_certificates/$fqdn_of_your_ce
chmod 600 /etc/simple_grid/host_certificates/$fqdn_of_your_ce/hostkey.pem
chmod 644 /etc/simple_grid/host_certificates/$fqdn_of_your_ce/hostcert.pem
```

In your example cluster, the above commands would look like:
```shell script
chmod 644 /etc/simple_grid/host_certificates/simple-lc-node-0.cern.ch
chmod 600 /etc/simple_grid/host_certificates/simple-lc-node-0.cern.ch/hostkey.pem
chmod 644 /etc/simple_grid/host_certificates/simple-lc-node-0.cern.ch/hostcert.pem
```

Your host_certificates directly would finally resemble the following (continuing from our example):
```shell session
$ls -la /etc/simple_grid/host_certificates/simple-lc-node0.cern.ch/
total 8
drw-r--r-- 2 root root   45 Jan 23 15:12 .
drwxr-xr-x 4 root root   69 Jan 23 15:12 ..
-rw-r--r-- 1 root root 3060 Jan 23 15:12 hostcert.pem
-rw------- 1 root root 1828 Jan 23 15:12 hostkey.pem
```
#### CVMFS proxy
For the HTCondor Workers to run production jobs from the grid, you must have a local CVMFS Squid proxy(an easy to configure 
Squid forward proxy server) configured and running at your site. 
If you are migrating from CREAM-CE, it is likely that you already have a local CVMFS Squid proxy running locally at your site. 
If so, you can just re-use that for your HTCondor SIMPLE cluster. If not, please set up a CVMFS Squid proxy server on 
a node that does not belong to the SIMPLE cluster.
If you support Atlas or CMS, you'll have to setup a [Frontier Squid server](https://twiki.cern.ch/twiki/bin/view/Frontier/InstallSquid). 
If not, then a regular Squid must be configured as described [here](http://cernvm.web.cern.ch/portal/cvmfs/examples).

#### SELinux
After you have identified a CM node and appropriate LC nodes, you must ensure that SELinux is disabled on the nodes. 
If you prefer to have SELinux enabled, please [get in touch](../help) and we can help figure out the SELinux policy 
required by Docker and Puppet to function correctly. Otherwise, just ensure that
sestatus returns disabled. 

For instance, in our example, on one of the LC nodes: 
```shell script
[root@simple-lc-node0 ~]# sestatus
SELinux status:                 disabled
```

#### Network and DNS settings
Please check the DNS settings and /etc/hosts files to make sure all of the nodes in the SIMPLE cluster can reach 
each other over the network available at your site.
In previous deployment instances, we have encountered situations where the deployment process would fail due to 
misconfiguration of network for the nodes in the SIMPLE cluster.

### Installation of Puppet
1. Install puppetserver, puppet-agent (Puppet 5) on your **CM node**. For CentOS7 distributions, the commands would be:
    ```shell script
    rpm -ivh https://yum.puppetlabs.com/puppet5/puppet5-release-el-7.noarch.rpm
    yum -y install puppetserver puppet-agent
    ```

1. Install puppet-agent (Puppet 5) on all of your **LC nodes**. For CC7, the commands are:
    ```
    rpm -ivh https://yum.puppetlabs.com/puppet5/puppet5-release-el-7.noarch.rpm
    yum install puppet-agent
    ```

1. Verify that puppet is installed. For instance,
    ```shell script
    [root@simple-lc-node0 ~]# puppet --version
     2020-01-23 14:41:11.130354 WARN  puppetlabs.facter - locale environment variables were bad; continuing with LANG=C LC_ALL=C
     5.5.17
    ```

## Installation of Central Configuration Manager 
The Central Configuration Manager or CCM in SIMPLE Framework's terminology is a framework component that manages 
the configuration and deployment of your SIMPLE Cluster. In case of puppet the CCM is the [simple_grid_puppet_module](https://forge.puppet.com/maany/simple_grid)
On the CM and all of the LC nodes, you will not install the latest [simple_grid_puppet_module](https://forge.puppet.com/maany/simple_grid) from Puppet Forge
using the command below:

```shell script
puppet module install maany-simple_grid
```

## Preparing a site level configuration file.

The site level configuration file is a YAML file where you describe your infrastructure and the lightweight components
you wish to deploy on your infrastructure along with additional information related to VOs and quotas etc.
The site level config is like a site-info.def file from the [YAIM](https://twiki.cern.ch/twiki/bin/view/LCG/YaimGuide400) 
realm. It is the only configuration file you need to instruct the framework on how it should set-up and configure the 
grid services on your infrastructure.

The framework provides a lot of features that can simplify and significantly reduce the size of the site level configuration file.
Generally 100-200 lines are enough to deploy very large clusters.
The discussion of these features(variable declaration, splitting of configuration into smaller config files, script injection, 
injection of additional config variables for grid services, ...) is out of scope for this tutorial. We are working on a detailed
guide on writing site level configuration files.

Here is what the site level configuration file for our example cluster looks like:
```yaml
### url of schema
schema:  "https://raw.githubusercontent.com/WLCG-Lightweight-Sites/simple_grid_site_repo/master/simple_base_schema.yaml"

### Variable declaration:
global_variables:
  - &lightweight_component01_ip_address 188.185.115.228
  - &lightweight_component01_fqdn simple-lc-node0.cern.ch
  - &lightweight_component02_ip_address 188.185.118.59
  - &lightweight_component02_fqdn simple-lc-node1.cern.ch
  - &lightweight_component03_ip_address 188.185.112.73
  - &lightweight_component03_fqdn simple-lc-node2.cern.ch
  - &lightweight_component04_ip_address 188.185.78.0
  - &lightweight_component04_fqdn simple-lc-node3.cern.ch
  - &lightweight_component05_ip_address 188.185.79.162
  - &lightweight_component05_fqdn simple-lc-node4.cern.ch

htcondor_ce_runtime_variables:
  - &htcondor_ce_runtime_var_ce_host simple-lc01.cern.ch

htcondor_batch_runtime_variables:
  - &htcondor_runtime_var_batch_host simple-lc04.cern.ch

site:
  name: 'OpenStack SIMPLE dev cluster'
  email: 'mayank.sharma@cern.ch'
  latitude: -6.50
  longitude: 106.84
  location: CERN
  description: 'CERN WLCG Grid by SIMPLE at CERN Openstack'
  website: 'https://home.cern'
  support_website: 'https://groups.google.com/forum/#!forum/wlcg-lightweight-sites'
  support_email: 'mayank.sharma@cern.ch'
  security_email: 'mayank.sharma@cern.ch'
  grid: 'wlcg' #site_other_grid: str(), wlcg, egi,osg
  tier: 3
  bdii_host: bdii.cern.ch
  cvmfs_http_proxy_list:
    - "http://ca-proxy.cern.ch:3128"
  use_argus: no
  timezone: CET


preferred_tech_stack:
  level_1_configuration: puppet
  level_2_configuration: sh
  container_orchestration: docker-swarm
  container: docker

site_infrastructure:
  - fqdn: *lightweight_component01_fqdn
    ip_address: *lightweight_component01_ip_address
  - fqdn: *lightweight_component02_fqdn
    ip_address: *lightweight_component02_ip_address
  - fqdn: *lightweight_component03_fqdn
    ip_address: *lightweight_component03_ip_address
  - fqdn: *lightweight_component04_fqdn
    ip_address: *lightweight_component04_ip_address
  - fqdn: *lightweight_component05_fqdn
    ip_address: *lightweight_component05_ip_address


lightweight_components:
  - type: compute_element
    name: HTCondor-CE
    repository_url: "https://github.com/simple-framework/simple_htcondor_ce"
    repository_revision: "master"
    execution_id: 0
    lifecycle_hooks:
      pre_config: []
      pre_init: []
      post_init: []
    deploy:
      - node: *lightweight_component01_fqdn
        container_count: 1
    preferred_tech_stack:
      level_2_configuration: sh
    config:
      condor_host_execution_id: 1
    supplemental_config:
      some_param: some_val
  - type: batch_system
    name: HTCondor-Batch
    repository_url: "https://github.com/andria009/simple_htcondor_batch"
    repository_revision: "master"
    execution_id: 1
    lifecycle_hooks:
      pre_config: []
      pre_init: []
      post_init: []
    deploy:
      - node: *lightweight_component02_fqdn
        container_count: 1
    preferred_tech_stack:
      level_2_configuration: sh
    config:
      placeholder_param: some_value
    supplemental_config:
      some_param: some_val
  - type: worker_node
    name: HTCondor-Worker
    repository_url: "https://github.com/simple-framework/simple_htcondor_worker"
    repository_revision: "master"
    execution_id: 2
    lifecycle_hooks:
      pre_config: []
      pre_init: []
      post_init: []
    deploy:
      - node: *lightweight_component03_fqdn
        container_count: 1
      - node: *lightweight_component04_fqdn
        container_count: 1
    preferred_tech_stack:
      level_2_configuration: sh
    config:
      condor_host_execution_id: 1
      num_slots: 28
    supplemental_config:
      some_param: some_val
supported_virtual_organizations:
  - *default_vo_alice
  - *default_vo_dteam
  - *default_vo_ops

voms_config:
  - voms_fqan: '/alice'
    pool_accounts:
      - *default_pool_accounts_alice
    vo: *default_vo_alice
  - voms_fqan: '/alice/ROLE=lcgadmin'
    pool_accounts:
      - *default_pool_accounts_alice
      - *default_pool_accounts_alicesgm
    vo: *default_vo_alice
    comment: sgm
  - voms_fqan: '/dteam'
    pool_accounts:
      - *default_pool_accounts_dteam
    vo: *default_vo_dteam
  - voms_fqan: '/dteam/ROLE=lcgadmin'
    pool_accounts:
      - *default_pool_accounts_dteamsgm
      - *default_pool_accounts_dteam
    vo: *default_vo_dteam
    comment: sgm
  - voms_fqan: '/ops'
    vo: *default_vo_ops
    pool_accounts:
      - *default_pool_accounts_ops
  - voms_fqan: '/ops/ROLE=lcgadmin'
    pool_accounts:
      - *default_pool_accounts_opssgm
      - *default_pool_accounts_ops
    vo: *default_vo_ops
    comment: sgm
```

The site level configuration file is compiled by the [simple_grid_yaml_compiler](https://github.com/simple-framework/simple_grid_yaml_compiler).
It is essential to ensure that your site level configuration file can be successfully compiled by it.

At present, to ensure you can compile your site level configuration file, you must:
1. [Get in touch](../help) with us directly and we will help compile and fix any errors in the site level configuration file.
1. Setup [compiler](https://github.com/simple-framework/simple_grid_yaml_compiler) as described [here](https://github.com/simple-framework/simple_grid_yaml_compiler/blob/master/README.md)
and run it with your site level configuration file as the input.

To simplify the process, we are working on a web based compiler, which will be available soon.

Below, we mention the instructions that should be sufficient to write a sensible site level configuration file.

First off, the framework can significantly assist you in writing your site level config file by generating 
a template for your HTCondor installation.

To do so, on the CM node, you can use the command below to generate a sample site level configuration file that you can modify 
for your installation. The sample HTCondor site_level_config_file.yaml is available at 
**/etc/simple_grid/site_config/site_level_config_file.yaml**

```shell script
puppet apply -e 'class{"simple_grid::install::config_master::simple_installer::create_sample_site_level_config_file":}'
```

Use any text editor to open the site level configuration file:
```shell script
vim /etc/simple_grid/site_config/site_level_config_file.yaml
```

You will see that the configuration file has the following distinct sections:
1. [schema](https://github.com/simple-framework/simple_grid_puppet_module/blob/production/templates/htcondor_sample_site_level_config_file.yaml.epp#L1)
1. [global_variables](https://github.com/simple-framework/simple_grid_puppet_module/blob/production/templates/htcondor_sample_site_level_config_file.yaml.epp#L4)
1. [runtime_variables](https://github.com/simple-framework/simple_grid_puppet_module/blob/production/templates/htcondor_sample_site_level_config_file.yaml.epp#L12-L16)
1. [site](https://github.com/simple-framework/simple_grid_puppet_module/blob/production/templates/htcondor_sample_site_level_config_file.yaml.epp#L18)
1. [preferred_tech_stack](https://github.com/simple-framework/simple_grid_puppet_module/blob/production/templates/htcondor_sample_site_level_config_file.yaml.epp#L38)
1. [site_infrastructure](https://github.com/simple-framework/simple_grid_puppet_module/blob/production/templates/htcondor_sample_site_level_config_file.yaml.epp#L44)
1. [lightweight_components](https://github.com/simple-framework/simple_grid_puppet_module/blob/production/templates/htcondor_sample_site_level_config_file.yaml.epp#L52)
1. [supported_virtual_organizations](https://github.com/simple-framework/simple_grid_puppet_module/blob/production/templates/htcondor_sample_site_level_config_file.yaml.epp#L108)
1. [voms_config](https://github.com/simple-framework/simple_grid_puppet_module/blob/production/templates/htcondor_sample_site_level_config_file.yaml.epp#L113)

### schema
This field can be left untouched. It instructs the compiler to use the following 
[schema](https://raw.githubusercontent.com/WLCG-Lightweight-Sites/simple_grid_site_repo/master/simple_base_schema.yaml) 
when compiling your site level configuration file.

### global_variables
The global variables sections is where you declare variables that can be re-used throughout your
site level configuration file.
To declare a new variable involves add an entry under the global variables section.
In the sample site level configuration file, you will see that we already have some variables declared:

```yaml
### Variable declaration:
global_variables:
  - &lightweight_component01_ip_address 188.184.104.25
  - &lightweight_component01_fqdn simple-lc01.cern.ch
  - &lightweight_component02_ip_address 188.184.30.19
  - &lightweight_component02_fqdn simple-lc02.cern.ch
  - &lightweight_component03_ip_address 188.184.84.189
  - &lightweight_component03_fqdn simple-lc03.cern.ch

```
To add a new variable, you can just create a new entry under the global_variables section. The new entry 
would have the following format:

```yaml
global_variables:
  - ..
  - ..
  - &new_variable_name value_of_the_variable
```

Let's create 2 new variables called condor_ce_ip_address and condor_ce_fqdn.
```yaml
global_variables:
  - &lightweight_component01_ip_address 188.184.104.25
  - &lightweight_component01_fqdn simple-lc01.cern.ch
  - &lightweight_component02_ip_address 188.184.30.19
  - &lightweight_component02_fqdn simple-lc02.cern.ch
  - &lightweight_component03_ip_address 188.184.84.189
  - &lightweight_component03_fqdn simple-lc03.cern.ch
  - &condor_ce_ip_address 188.185.115.228
  - &condor_ce_fqdn simple-lc-node0.cern.ch
```   

We recommend creating a variable for the fqdn and ip address of each LC node and then re-using them throughout the site level configuration wherever required. 

For our example cluster, the global_variables section will look as follows:
```yaml
global_variables:
  - &condor_ce_ip_address 188.185.115.228
  - &condor_ce_fqdn simple-lc-node0.cern.ch
  - &condor_batch_ip_address 188.185.118.59
  - &condor_batch_fqdn simple-lc-node1.cern.ch
  - &condor_wn1_ip_address 188.185.112.73
  - &condor_wn1_fqdn simple-lc-node2.cern.ch
  - &condor_wn2_ip_address 188.185.78.0
  - &condor_wn2_fqdn simple-lc-node3.cern.ch
```

### runtime_variables
The runtime variables are an advanced feature of the framework. They enable grid experts to add support to grid services through SIMPLE 
to request some additional information information from site admins that is required for configuring the grid services.


It is necessary to provide a value to these variables to ensure that the containerized services can get configured properly.
For the HTCondor SIMPLE cluster, we need two runtime_variables, namely, 

- **htcondor_ce_runtime_var_ce_host** : The FQDN of the LC node where you wish to deploy HTCondorCE
- **htcondor_batch_runtime_var_batch_host**: The FQDN of LC node where you wish to deploy HTCondorBatch

In our example, these sections look as follows:
```yaml
htcondor_ce_runtime_variables:
  - &htcondor_ce_runtime_var_ce_host simple-lc01.cern.ch

htcondor_batch_runtime_variables:
  - &htcondor_runtime_var_batch_host simple-lc02.cern.ch
```

Update your site level configuration file to include the *htcondor_ce_runtime_variables* section and assign 
the *&htcondor_ce_runtime_var_ce_host* variable to point to your HTCondorCE LC host.


Then add the *htcondor_batch_runtime_variables* section to your site level configuration and update the value 
of *&htcondor_runtime_var_batch_host* to point to your HTCondor Batch LC host.



### site

The site section contains generic information about your site like name, location, website, timezone, ... . 

For the test cluster you set up, you **may** update any or all of the fields based on your site. 
However, you **must** set the **timezone** field. Find your timezone relative to the **/usr/share/zoneinfo**
directory and put the relative path as the value for the timezone field in the site section.

For the example cluster, the site section looks as follows:
```yaml
site:
  name: 'OpenStack SIMPLE dev cluster'
  email: 'mayank.sharma@cern.ch'
  latitude: 46.3
  longitude: 6.2
  location: CERN, Geneva, Switzerland
  description: 'CERN HTCondor cluster by SIMPLE @ CERN Openstack'
  website: 'https://home.cern'
  support_website: 'https://groups.google.com/forum/#!forum/wlcg-lightweight-sites'
  support_email: 'mayank.sharma@cern.ch'
  security_email: 'mayank.sharma@cern.ch'
  grid: 'wlcg'
  tier: 3
  bdii_host: bdii.cern.ch
  cvmfs_http_proxy_list:
    - "http://ca-proxy.cern.ch:3128"
  use_argus: no
  timezone: CET
```

### preferred_tech_stack
SIMPLE framework, by design, can be implemented in various popular tools for configuration management, container orchestration, ... 

This section describes the set of technologies the framework should use to configure the LC hosts and Grid service containers. 

For now, the section can remain unchanged, as the supported technologies do not have any alternatives.

For our example and for your SIMPLE cluster, this section would look as follows:

```yaml
preferred_tech_stack:
  level_1_configuration: puppet
  level_2_configuration: sh
  container_orchestration: docker-swarm
  container: docker
```

### site_infrastructure
In this section, you tell the framework about how to access the LC hosts. If any of your LC hosts have multiple network interfaces,
please use the IP address that corresponds to the interface that can access all the other LC hosts in your network.

For each LC host, you need to make an entry that consists of its fqdn and IPv4 address.
For instance, the YAML object for a node simple-lc-node0.cern.ch with IPv4 address 188.184.104.25 would look as follows:
```yaml
site_infrastructure:
  - fqdn: simple-lc-node0.cern.ch
    ip_address: 188.184.104.25
```

If in the global variables section, there already is an entry for these, we could directly use the values of these variables.
Let's say lightweight_component01_fqdn corresponds to simple-lc-node0.cern.ch, while lightweight_component01_ip_address 
corresponds to 188.184.104.25, then the above section can be re-written as:

```yaml
site_infrastructure:
  - fqdn: *lightweight_component01_fqdn
    ip_address: *lightweight_component01_ip_address
```
For our example cluster, where we have already declared variables for the IP Addresses and FQDNs for each of our LC hosts,
this section looks as follows:

```yaml
site_infrastructure:
  - fqdn: *lightweight_component01_fqdn
    ip_address: *lightweight_component01_ip_address
  - fqdn: *lightweight_component02_fqdn
    ip_address: *lightweight_component02_ip_address
  - fqdn: *lightweight_component03_fqdn
    ip_address: *lightweight_component03_ip_address
  - fqdn: *lightweight_component04_fqdn
    ip_address: *lightweight_component04_ip_address
  - fqdn: *lightweight_component05_fqdn
    ip_address: *lightweight_component05_ip_address
```

### lightweight_components
In this section you tell the framework about the configuration of the grid services that should be deployed on the LC hosts, specified in the site_infrastructure section.
For the SIMPLE HTCondor cluster, these services are the HTCondor-CE, HTCondor-Batch and HTCondor-Workers. 

The following YAML code describes our example HTCondor cluster. You can use it as-is for your own SIMPLE HTCondor cluster after applying the modifications mentioned below:

```yaml
lightweight_components:
  - type: compute_element
    name: HTCondor-CE
    repository_url: "https://github.com/simple-framework/simple_htcondor_ce"
    repository_revision: "master"
    execution_id: 0
    lifecycle_hooks:
      pre_config: []
      pre_init: []
      post_init: []
    deploy:
      - node: *lightweight_component01_fqdn
        container_count: 1
    preferred_tech_stack:
      level_2_configuration: sh
    config:
      condor_host_execution_id: 1
    supplemental_config:
      some_param: some_val
  - type: batch_system
    name: HTCondor-Batch
    repository_url: "https://github.com/andria009/simple_htcondor_batch"
    repository_revision: "master"
    execution_id: 1
    lifecycle_hooks:
      pre_config: []
      pre_init: []
      post_init: []
    deploy:
      - node: *lightweight_component02_fqdn
        container_count: 1
    preferred_tech_stack:
      level_2_configuration: sh
    config:
      placeholder_param: some_value
    supplemental_config:
      some_param: some_val
  - type: worker_node
    name: HTCondor-Worker
    repository_url: "https://github.com/simple-framework/simple_htcondor_worker"
    repository_revision: "master"
    execution_id: 2
    lifecycle_hooks:
      pre_config: []
      pre_init: []
      post_init: []
    deploy:
      - node: *lightweight_component03_fqdn
        container_count: 1      
      - node: *lightweight_component04_fqdn
        container_count: 1      
    preferred_tech_stack:
      level_2_configuration: sh
    config:
      condor_host_execution_id: 1
      num_slots: 4
    supplemental_config:
      some_param: some_val
```
For each of HTCondor-CE, HTCondor-Batch and HTCondor-Worker, please modify the **node field** of the **deploy sections** to point to 
the corresponding LC node/s in you cluster.

In the config section of the HTCondor-Worker, please adjust the **num_slots** parameter to a number less than or 
equal to the number of cores available on the LC host/s where you wish to deploy the HTCondor-Worker. 

For the purpose of the the test cluster, you may leave everything else in the lightweight_components section unchanged.
It is possible to fine-tune the HTCondor configuration directly from the lightweight_components section. 
We will create a detailed document describing how to do so. Please [talk to us](../help) to learn more about these.
 
In the meantime, here's a quick note on the advanced configuration fields/sub-sections of a lightweight component:

- **execution_id**: This field controls the order in which grid services are deployed. Lower execution ids are executed the earliest.

- **lifecycle_hooks**: The lifecycle_hooks section enables you to inject custom shell scripts to customize the deployment of grid services. 

- **supplemental_config**: The supplemental config section enables you to inject custom condor configuration knobs directly in the HTCondor configuration files.
You can also use the supplemental config section to modify any other file inside of the grid service containers. 
For instance, you could modify the /etc/hosts to add DNS info for your local site services.

- **preferred_tech_stack**: The preferred_tech_stack section can be used to control the configuration management technology used to configure HTCondor 
inside of the containers. At present, the only supported configuration technology is *shell*, hence the value of level_2_configuration is *sh*.

- **repository_url**: The GitHub URL of a lightweight component repository, or simply a component repository. It contains the HTCondor containers and configuration code that will run
on your infrastructure.

- **repository_revision**: The branch/tag on GitHub determining the  component repository version. 

- **config**: This section is where you provide values for variables mentioned in the config-schema.yaml files present 
at the root of the corresponding component repositories. For HTCondor-CE, the config-schema.yaml is present 
[here](https://github.com/simple-framework/simple_htcondor_ce/blob/master/config-schema.yaml).

### supported_virtual_organizations
Here you tell the framework about the VOs that your site supports. The framework provides **default VO Configuration 
for all four LHC VOs, dteam and ops**. The default variables that you can use in your site level configuration file
can be seen in the site_level_configuration_defaults.yaml file present 
[here](https://github.com/simple-framework/simple_grid_site_repo/blob/master/site_level_configuration_defaults.yaml).

To support Atlas and Alice in your site, 
```yaml
supported_virtual_organizations:
- *default_vo_atlas
- *default_vo_alice
```

In our example cluster, we support Alice, Ops and Dteam VOs, therefore the supported_virtual_organizations section looks as follows:
```yaml
supported_virtual_organizations:
  - *default_vo_alice
  - *default_vo_dteam
  - *default_vo_ops
```

### voms_config
This section describes the VOMS FQANs to pool accounts mapping that the framework should configure for relevant grid services.
For our example cluster, this section looks as follows:
```yaml
voms_config:
  - voms_fqan: '/alice'
    pool_accounts:
      - *default_pool_accounts_alice
    vo: *default_vo_alice
  - voms_fqan: '/alice/ROLE=lcgadmin'
    pool_accounts:
      - *default_pool_accounts_alice
      - *default_pool_accounts_alicesgm
    vo: *default_vo_alice
    comment: sgm
  - voms_fqan: '/dteam'
    pool_accounts:
      - *default_pool_accounts_dteam
    vo: *default_vo_dteam
  - voms_fqan: '/dteam/ROLE=lcgadmin'
    pool_accounts:
      - *default_pool_accounts_dteamsgm
      - *default_pool_accounts_dteam
    vo: *default_vo_dteam
    comment: sgm
  - voms_fqan: '/ops'
    vo: *default_vo_ops
    pool_accounts:
      - *default_pool_accounts_ops
  - voms_fqan: '/ops/ROLE=lcgadmin'
    pool_accounts:
      - *default_pool_accounts_opssgm
      - *default_pool_accounts_ops
    vo: *default_vo_ops
    comment: sgm
```

Please modify this section accordingly for your own site level configuration files. 
The default variables for all four LHC VOs, DTeam and Ops that you can use can be seen in 
[this file](https://github.com/simple-framework/simple_grid_site_repo/blob/master/site_level_configuration_defaults.yaml).



## Simple Installer for CM
After writing the site level configuration file, run the simple installer on the CM node using to validate your 
site level configuration file and install/configure various components of the SIMPLE framework on CM:

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


