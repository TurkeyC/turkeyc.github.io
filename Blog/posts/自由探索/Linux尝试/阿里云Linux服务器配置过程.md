---
title: 我的阿里云Linux服务器配置过程备忘录
date: 2025-01-23
tags: [开发日志,Linux]
category: 原创
pinned: false
---

- 202501231057

在阿里云购买了一部轻量应用服务器：

实例名称：Ubuntu-████
实例ID：████████████████████████
IP地址：████████(公) ████████(私)
配置信息：Ubuntu22.04/2vCPU/2GiB-ESSD云盘/40GiB
服务器到期时间：2026年1月24日 00:00:00
服务器管理员账号：root
服务器密码：████████

然后开放了21、22等端口，使用Xshell和Xftp成功进行了链接；

但是发现Xshell的使用并不太符合我的习惯，因此试图在win11的powershell中直接链接服务器；

于是找到了https://blog.csdn.net/IT_iosers/article/details/144725544 ，参考其中的方法进行输入：   

```powershell
PS C:\Users\████████> ssh-keygen
Generating public/private ████████ key pair.
Enter file in which to save the key (C:\Users\████████/.ssh/████████):
Created directory 'C:\\Users\\████████/.ssh'.
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in C:\Users\████████/.ssh/████████
Your public key has been saved in C:\Users\████████/.ssh/████████.pub
The key fingerprint is:
SHA256:████████████████████████████████ ████████@████████████████
The key's randomart image is:
████████
```

获得私钥`"C:\Users\████████\.ssh\████████"`和公钥`"C:\Users\████████\.ssh\████████"`；

提取出公钥内容：`████████ ████████████████████████████████████████ ████████@████████`；

在阿里云服务器上创建了密钥对，命名为`TXAir2024-Win11`，并将该密钥对应用在我的服务器实例上，重启进行配置。

同时在本机创建了配置文件`"C:\Users\████████\.ssh\config"`，输入：

```cmd
Host AliYun-Ubuntu-████████
    HostName ████████
    User root
```

这样就可以直接在powershell中输入`ssh AliYun-Ubuntu-████████`来链接了；

而此时发现Xshell和Xftp无法使用密码直接登录了，于是将刚才一起产生的用户密钥`"C:\Users\████████\.ssh\████████"`一起导入Xshell和Xftp后即可连接了；

> **注意：由于我设置的密钥密码为空，因此通过私钥登陆时不用输入密码**

以下是输入在powershell中输入`ssh AliYun-Ubuntu-████████`后返回的内容(理论上`ssh root@████████`应该也有相同效果)：

```powershell
PS C:\Users\████████> ssh AliYun-Ubuntu-████████
The authenticity of host '████████ (████████)' can't be established.
████████ key fingerprint is ████████████████████████████████████████.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '████████' (████████) to the list of known hosts.
Welcome to Ubuntu 22.04.4 LTS (GNU/Linux 5.15.0-107-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Thu Jan 23 11:15:41 AM CST 2025

  System load:  0.0               Processes:             122
  Usage of /:   7.9% of 39.01GB   Users logged in:       0
  Memory usage: 15%               IPv4 address for eth0: █████████████
  Swap usage:   0%


Expanded Security Maintenance for Applications is not enabled.

116 updates can be applied immediately.
69 of these updates are standard security updates.
To see these additional updates run: apt list --upgradable

2 additional security updates can be applied with ESM Apps.
Learn more about enabling ESM Apps service at https://ubuntu.com/esm

New release '24.04.1 LTS' available.
Run 'do-release-upgrade' to upgrade to it.



Welcome to Alibaba Cloud Elastic Compute Service !

Last login: Thu Jan 23 10:16:56 2025 from ████████
root@████████████████:~#
```

在这之后有参考了windows命令的相关文档https://learn.microsoft.com/zh-cn/windows/terminal/tutorials/ssh 和https://learn.microsoft.com/zh-cn/windows/terminal/install#settings-json-file ，在JSON文件中添加了如下内容：

```json
{
	"colorScheme": "Campbell Powershell",
	"commandline": "ssh root@████████",
	"guid": "{████████████████}",
	"hidden": false,
	"icon": "ms-appx:///ProfileIcons/{████████████████}.png",
	"name": "AliYun-Ubuntu-████████"
}
```

这样就可以直接在powershell的下拉选项中打开了，就像wsl一样方便。



---



- 202501231234

运行了`sudo apt install xubuntu-desktop`命令，试图在服务器上安装一个xfce桌面，选择了lightdm环境；

运行了`sudo apt install git npm nodejs`命令，为了从GitHub获取NoVNC；

运行了`git clone https://github.com/novnc/noVNC.git `，进入`cd noVNC`，运行`./utils/novnc_proxy --listen 6080 --vnc localhost:5901`，设置VNC端口为5900，映射出的端口为6080，在运行时发现自动下载了websockify；

给出了链接是：http://████████████████:6080/vnc.html?host=████████████████&port=6080，但是发现阿里云上端口没有开放;

在阿里云防火墙上重新配置后，再次打开powershell，执行`cd noVNC `与`./utils/novnc_proxy --listen 6080 --vnc localhost:5900`，试图进入http://████████:6080/vnc.html ，但是发现还是不行；

在寻求deepseek指导后，执行`sudo apt install tightvncserver -y`，并执行`vncserver`，设置密码为`████████`

将`/root`下的`noVNC`文件夹迁移到`/opt`下，创建文件`/opt/noVNC/start_novnc.sh`，写入：

```bash
#!/bin/bash
/opt/noVNC/utils/launch.sh --vnc localhost:5901
```

保存并退出，然后输入`sudo chmod +x /opt/noVNC/start_novnc.sh`以赋予执行权限，

巴拉巴拉，按照deepseek折腾了一大堆，最终执行脚本：

```bash
/opt/noVNC/start_novnc.sh
```

可以通过http://████████:6080/vnc.html进入，但是界面一片灰。

按照deepseek所说，将`/root/.vnc/xstartup`文件内容修改为

```bash
#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XKL_XMODMAP_DISABLE=1
export XDG_CURRENT_DESKTOP=XFCE
startxfce4 &
```

保存退出后再执行`chmod +x /root/.vnc/xstartup`即可。

于是，目前启动noVNC的方法就是：

> ==**在Linux端运行 /opt/noVNC/start_novnc.sh 指令，在网页端输入网址 http://████████:6080/vnc.html ，在输入密码 ████████ 即可进入noVNC中的XFCE桌面环境**==(此外，可以通过vncserver -kill :1 命令来停止当前 VNC 服务器)



---



- 202501261131

由于之前配置的VNC不知道怎么回事，时灵时不灵，于是暂且做成了快照`s-████████████████`，幸亏之前早已做了初始快照`s-████████████████`，于是就将硬盘回滚过去了。

通过`adduser ██`命令增加了一位用户██，密码为██，以下为创建过程：

```bash 
root@████████████████:~# adduser ██
Adding user `██' ...
Adding new group `██' (1001) ...
Adding new user `██' (1001) with group `██' ...
Creating home directory `/home/██' ...
Copying files from `/etc/skel' ...
New password: ██
Retype new password: ██
passwd: password updated successfully
Changing the user information for ██
Enter the new value, or press ENTER for the default
        Full Name []:
        Room Number []:
        Work Phone []:
        Home Phone []:
        Other []:
Is the information correct? [Y/n] y
```

然后把公钥也同步过去了，这样为了安全起见，==以后就可以用 `ssh ██@████████` 来登录啦，密码是`██`哦==；



---



- 202501261302在██用户

执行`sudo apt update && sudo apt install docker.io`命令，安装了docker；

为 Docker 添加国内镜像源（阿里云镜像加速）:

```bash
# 创建 Docker 配置目录
sudo mkdir -p /etc/docker

# 添加镜像加速器配置（阿里云镜像源，需替换为你的专属加速地址）
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://████████.mirror.aliyuncs.com "]#我的阿里云镜像加速地址
}
EOF

# 重启 Docker 服务
sudo systemctl daemon-reload
sudo systemctl restart docker
```



执行`sudo docker run -d -p 8080:8080 -v /nextcloud:/var/www/html nextcloud`命令，安装并运行 Nextcloud 私人网盘容器，以下是输出：

```bash
██@████████████████:~$ sudo docker run -d -p 8080:80 -v /nextcloud:/var/www/html nextcloud
Unable to find image 'nextcloud:latest' locally
latest: Pulling from library/nextcloud
a2abf6c4d29d: Pull complete
......
57f778f1c66e: Pull complete
Digest: sha256:████████████████████████████████████████
Status: Downloaded newer image for nextcloud:latest
████████████████████████████████████████████████████████

██@████████████████:~$ sudo docker images
REPOSITORY   TAG       IMAGE ID       CREATED       SIZE
nextcloud    latest    c805c152803c   3 years ago   969MB

██@████████████████:~$ sudo docker ps -a
CONTAINER ID   IMAGE       COMMAND                  CREATED          STATUS          PORTS
     NAMES
de99acff3e09   nextcloud   "/entrypoint.sh apac…"   37 minutes ago   Up 37 minutes   0.0.0.0:8080->80/tcp, :::8080->80/tcp   pedantic_carson

██@████████████████:~$ sudo docker stop pedantic_carson
pedantic_carson

██@████████████████:~$ sudo docker rename pedantic_carson nextcloud

██@████████████████:~$ sudo docker ps -a
CONTAINER ID   IMAGE       COMMAND                  CREATED          STATUS                      PORTS     NAMES
de99acff3e09   nextcloud   "/entrypoint.sh apac…"   43 minutes ago   Exited (0) 40 seconds ago             nextcloud

██@████████████████:~$ sudo docker start nextcloud
nextcloud
```



==进入网址：http://████████:8080/ 就可以啦==

==创建管理员账号：`████████`，密码：████████`，设置了电子邮件：`████████@outlook.com`==

==选择SQLite作为数据库，数据目录为：`/var/www/html/data`==

==以后要是意外关机了，可以用`sudo docker start nextcloud`命令来再次启动网盘容器。==



---



- 202502041251

在[QQ开放平台](https://q.qq.com )上进行了注册

邮箱：████████@qq.com
密码：████████
手机号：████████
获取了机器人管理员权限

[QQ机器人](https://q.qq.com/qqbot/#/home )
名称：████████
机器人QQ号：████████
AppID (机器人ID)：████████
Token(机器人令牌)：████████████████████████████████
AppSecret(机器人密钥)：████████████████████████████████
IP白名单：████████（我的阿里云服务器）

在Linux服务器的██用户中`mkdir astrbot`

在github上通过action拉取docker镜像soulter/astrbot:latest；
注意在非root用户中使用docker要先sudo提权！

```bash
#登录阿里云
sudo docker login --username=aliyun████████ crpi-████████████████.cn-hangzhou.personal.cr.aliyuncs.com

#下载镜像
sudo docker tag [ImageId] crpi-████████████████.cn-hangzhou.personal.cr.aliyuncs.com/████████-images/astrbot

#修改镜像名称
sudo docker tag crpi-████████████████.cn-hangzhou.personal.cr.aliyuncs.com/████████-images/astrbot:latest astrbot:latest

#删除旧镜像
sudo docker rmi crpi-████████████████.cn-hangzhou.personal.cr.aliyuncs.com/████████-images/astrbot:latest

#根据刚才的astrbot镜像创建一个名为astrbot的容器，配置好端口并后台运行
sudo docker run -itd -p 6180-6200:6180-6200 -p 11451:11451 -v $PWD/data:/AstrBot/data --name astrbot astrbot
```

在阿里云控制台上开放了6180/6200和11451端口；

使用：

```bash
sudo docker logs -f astrbot
```

命令**查看 AstrBot 的日志**，验证了容器astrbot确实在正常运行，同时返回了聊天机器人的控制台端口为6185；

在物理机上登录http://████████:6185 ，进入astrbot控制面板，默认用户名和密码为 astrbot修改了用户名和密码：

```txt
用户名：████████
密码：████████████████
```

在控制台配置了api，这样就可以了。



---



- 20250216

在██用户使用：

```bash
sudo docker run -d -p 3210:3210 \
  -e OPENAI_API_KEY=████████████████████████████████ \
  -e OPENAI_PROXY_URL=https://api.deepseek.com/v1 \
  -e ACCESS_CODE=lobe66 \
  --name lobe-chat \
  lobehub/lobe-chat
```

部署了lobe-chat，网址是http://████████:3210 ，设置管理员密码为`██`

不好用，于是运行：

```bash
sudo docker stop lobe-chat && docker rm lobe-chat
```

停止并卸载了容器，但保留了镜像



---



- 20250217

在用户██中运行：

```bash
# 克隆仓库
sudo apt install git
git clone https://github.com/SillyTavern/SillyTavern && cd SillyTavern/docker

# 拉取node:lts-alpine3.19镜像
sudo docker pull crpi-████████████████.cn-hangzhou.personal.cr.aliyuncs.com/████████-images/node:lts-alpine3.19
sudo docker tag crpi-████████████████.cn-hangzhou.personal.cr.aliyuncs.com/████████-images/node:lts-alpine3.19 node:lts-alpine3.19
sudo docker rmi crpi-████████████████.cn-hangzhou.personal.cr.aliyuncs.com/████████-images/node:lts-alpine3.19

# 构建镜像ghcr.io/sillytavern/sillytavern:latest
cd SillyTavern/docker
sudo docker-compose up -d

# 执行以下 Docker 命令以获取 SillyTavern Docker 容器的 IP
docker network inspect docker_default
# 得到了 "Subnet": "████████/16","Gateway": "████████"

cd SillyTavern/docker
sudo nano config/config.yaml
# 修改内容为：
# whitelist:
#     - 127.0.0.1
#     - ████████
# 以及允许使用设置多个账号：
# enableUserAccounts: true
# 和允许在登录页面隐藏用户列表：
# enableDiscreetLogin：true
# 还有设置端口：
# port: 8000
# 以及jin设置登录用户名与密码：
# whitelistMode: false
# basicAuthUser: true
# username: ████████
# password: ██

#重新启动 Docker 容器以应用新配置。
sudo docker-compose restart sillytavern
```

安装了SillyTavern 1.12.12

访问http://████████:8000/ 即可

username: ████████
password: ██

创建默认管理员用户User

创建新用户：████████，用户句柄：████████，密码设定为：██

将████████提权为Admin管理员

将默认用户User禁用



---



- 20250219

随手按照 [官方教程](https://docs.n8n.io/hosting/installation/docker/#starting-n8n ) 在██用户中配置了N8N



---



- 20250222

在root用户中，安装.NET运行时：

```bash
# 安装依赖
apt install -y wget tar

# 添加微软包仓库
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# 安装.NET 6.0运行时
apt update && apt install -y aspnetcore-runtime-6.0
```

之后内容全部在██用户下进行；

根据[AstrBot官方教程](https://astrbot.app/deploy/platform/aiocqhttp/lagrange.html )与[Lagrange.OneBot官方教程](https://lagrangedev.github.io/Lagrange.Doc/Lagrange.OneBot/ )，进行配置：

```bash
#创建配置目录
sudo mkdir -p ~/qqbot/config && cd ~/qqbot

#生成配置文件
sudo nano config/appsettings.json
#写下以下内容：
#{
#  "qq": ████████,
#  "password": "████████",
#  "protocol": "Linux",
#  "onebot": {
#    "host": "0.0.0.0",
#    "port": 7700,
#    "websocket": true
#  }
#}

#在阿里云上搞了镜像：ghcr.io/lagrangedev/lagrange.onebot:sha-903dce7

sudo docker login --username=aliyun████████ crpi-████████████████.cn-hangzhou.personal.cr.aliyuncs.com
sudo docker pull crpi-████████████████.cn-hangzhou.personal.cr.aliyuncs.com/████████-images/lagrange.onebot:sha-903dce7
sudo docker tag crpi-████████████████.cn-hangzhou.personal.cr.aliyuncs.com/████████-images/lagrange.onebot:sha-903dce7 ghcr.io/lagrangedev/lagrange.onebot:sha-903dce7
sudo docker rmi crpi-████████████████.cn-hangzhou.personal.cr.aliyuncs.com/████████-images/lagrange.onebot:sha-903dce7

#启动Docker容器
sudo docker run -d \
  --name lagrange_qqbot \
  -v ~/qqbot/config:/app/config \
  -p 7700:7700 \
  --restart=always \
  ghcr.io/lagrangedev/lagrange.onebot:sha-903dce7

#好像不能用，删掉重来
sudo docker stop lagrange_qqbot && sudo docker rm lagrange_qqbot

#重新创建dockers容器
sudo docker run -d \
  --name lagrange_qqbot \
  -v /home/██/qqbot/config:/app/config \
  -v /home/██/qqbot/data:/app/data \
  -p 7700:7700 \
  --restart=always \
  ghcr.io/lagrangedev/lagrange.onebot:sha-903dce7
  
#验证了docker重启后会自动登录
docker restart lagrange_qqbot

#但是还是不行，端口有误，重来
sudo docker stop lagrange_qqbot && sudo docker rm lagrange_qqbot

# 重建容器（使用绝对路径+严格权限-ro只读挂载）
sudo docker run -d \
  --name lagrange_qqbot \
  -v /home/██/qqbot/config:/app/config:ro \
  -v /home/██/qqbot/data:/app/data \
  -p 7700:7700 \
  --restart=unless-stopped \
  ghcr.io/lagrangedev/lagrange.onebot:sha-903dce7

sudo docker run -d \
  --name lagrange_qqbot \
  -v /home/██/qqbot/config:/app/config:ro \
  -v /home/██/qqbot/data:/app/data \
  -p 7700:7700 \
  -e TZ=Asia/Shanghai \
  --restart=always \
  ghcr.io/lagrangedev/lagrange.onebot:sha-903dce7


sudo docker logs -f lagrange_qqbot

#最终还是失败了呜呜呜

#删除跑路了
sudo docker stop lagrange_qqbot && sudo docker rm lagrange_qqbot
```



最后还是听从了Deepseek的指导，选择直接进行安装

**在root用户中**，创建并进入了qqbot用户：

```bash
useradd -m qqbot
su - qqbot
```
这样就进入了qqbot用户

```bash
wget https://github.com/LagrangeDev/Lagrange.Core/releases/download/nightly/Lagrange.OneBot_linux-x64_net9.0_SelfContained.tar.gz 
```

还是放弃了，卸载了qqbot用户

```bash
sudo userdel -r qqbot
```



**又回到了██用户，现在尝试使用NapCatQQ 协议**

按照[AstrBot官方教程](https://astrbot.app/deploy/platform/aiocqhttp/napcat.html )和[NapCat官方教程](https://napcat.napneko.icu/ )进行部署

```bash
curl -o napcat.sh https://nclatest.znin.net/NapNeko/NapCat-Installer/main/script/install.sh && sudo bash napcat.sh --docker y --qq "████████" --mode ws --proxy 1 --confirm
```

curl -o napcat.sh https://nclatest.znin.net/NapNeko/NapCat-Installer/main/script/install.sh && sudo bash napcat.sh --tui

████████



以下是部分的日志内容：

```bash
[2025-02-22 21:42:01]: 开始更新依赖...
[2025-02-22 21:42:01]: 当前高级包管理器: apt-get
[2025-02-22 21:42:01]: 更新软件包列表中...
[2025-02-22 21:42:14]: 更新软件包列表 (sudo apt-get update -y -qq)成功
[2025-02-22 21:42:14]: 安装zip unzip jq curl xvfb screen xauth procps中...
[2025-02-22 21:43:16]: 安装zip unzip jq curl xvfb screen xauth procps (sudo apt-get install -y -qq zip unzip jq curl xvfb screen xauth procps)成功
[2025-02-22 21:43:16]: 更新依赖成功...
[2025-02-22 21:43:16]: 开始下载NapCat安装包,请稍等...
[2025-02-22 21:43:16]: proxy 未指定或超出范围, 正在检查Github代理可用性...
[2025-02-22 21:43:19]: 将使用Github代理: https://ghfast.top
[2025-02-22 21:43:24]: NapCat.Shell.zip 成功下载。
[2025-02-22 21:43:24]: 正在验证 NapCat.Shell.zip...
[2025-02-22 21:43:25]: 正在解压 NapCat.Shell.zip...
[2025-02-22 21:43:26]: 当前基础包管理器: dpkg
[2025-02-22 21:43:26]: 最低linuxQQ版本: 3.2.15-30899, 构建: 30899
[2025-02-22 21:43:26]: 当前系统架构: amd64
[2025-02-22 21:43:26]: 安装LinuxQQ...
[2025-02-22 21:43:26]: QQ下载链接: https://dldir1.qq.com/qqfile/qq/QQNT/63c751e8/linuxqq_3.2.15-30899_amd64.deb
[2025-02-22 21:43:26]: 如果无法下载请手动下载QQ安装包并重命名为QQ.deb或QQ.rpm(注意自己的系统架构)放到脚本同目录下
[2025-02-22 21:43:34]: 文件下载成功
[2025-02-22 21:43:34]: 安装QQ中...
[2025-02-22 21:44:52]: 安装QQ (sudo apt-get install -f -y -qq ./QQ.deb)成功
[2025-02-22 21:44:52]: 安装libnss3中...
[2025-02-22 21:44:53]: 安装libnss3 (sudo apt-get install -y -qq libnss3)成功
[2025-02-22 21:44:53]: 安装libgbm1中...
[2025-02-22 21:45:18]: 安装libasound2 成功
[2025-02-22 21:45:18]: 正在更新用户QQ配置...
[2025-02-22 21:45:19]: 更新用户QQ配置成功...
[2025-02-22 21:45:19]: 最新NapCatQQ版本: v4.5.23
[2025-02-22 21:45:19]: 正在移动文件...
[2025-02-22 21:45:20]: 移动文件成功
[2025-02-22 21:45:20]: 正在修补文件...
[2025-02-22 21:45:20]: 修补文件成功
[2025-02-22 21:45:20]: 正在修改QQ启动配置...
修改QQ启动配置成功...
[2025-02-22 21:45:22]: 安装NapCatQQ CLI...
[2025-02-22 21:45:22]: proxy 未指定或超出范围, 正在检查Github代理可用性...
[2025-02-22 21:45:24]: 将使用Github代理: https://ghfast.top
[2025-02-22 21:45:24]: NapCatQQ CLI 下载链接: https://ghfast.top/https://raw.githubusercontent.com/NapNeko/NapCat-Installer/refs/heads/main/script/napcat
[2025-02-22 21:45:25]: napcatcli 成功下载。
[2025-02-22 21:45:25]: 正在移动文件...
[2025-02-22 21:45:25]: 移动文件成功
[2025-02-22 21:45:26]:
安装完成。
[2025-02-22 21:45:26]:
[2025-02-22 21:45:26]: 输入 xvfb-run -a qq --no-sandbox 命令启动。
[2025-02-22 21:45:26]: 保持后台运行 请输入 screen -dmS napcat bash -c "xvfb-run -a qq --no-sandbox"
[2025-02-22 21:45:26]: 后台快速登录 请输入 screen -dmS napcat bash -c "xvfb-run -a qq --no-sandbox -q QQ号码"
[2025-02-22 21:45:26]: Napcat安装位置 /opt/QQ/resources/app/app_launcher/napcat
[2025-02-22 21:45:26]: WEBUI_TOKEN 请自行查看/opt/QQ/resources/app/app_launcher/napcat/config/webui.json文件获取
[2025-02-22 21:45:26]: 注意, 您可以随时使用 screen -r napcat 来进入后台进程并使用 ctrl + a + d 离开(离开不会关闭后台进程)。
[2025-02-22 21:45:26]: 停止后台运行 请输入 screen -S napcat -X quit
[2025-02-22 21:45:26]:
新方法(未安装cli请忽略):
[2025-02-22 21:45:27]: 输入 napcat help  获取帮助。
[2025-02-22 21:45:27]: 后台快速登录 请输入 napcat start QQ账号
[2025-02-22 21:45:27]: 建议非root用户使用sudo执行命令以防止出现一些奇奇怪怪的bug, 例如 sudo napcat help
```

当输入`sudo napcat help`后，会给出菜单：

```bash 
napcat 控制脚本

使用方法:
  napcat {start|stop|restart|status|log|startup|startdown} QQ
  napcat {status|update|rebuild|remove|help|oldhelp}

    napcat start {QQ}                     启动对应QQ号的NAPCAT
    napcat stop {QQ}[可选]                停止所有[对应QQ号]的NAPCAT及DLC
    napcat restart {QQ}                   重启对应QQ号的NAPCAT
    napcat status {QQ}[可选]              查看所有[对应QQ号]的NAPCAT
    napcat log {QQ}                       查看对应QQ号的NAPCAT日志
    napcat startup {QQ}                   添加开机自启动对应QQ号的NAPCAT及DLC
    napcat startdown {QQ}                 取消开机自启动对应QQ号的NAPCAT及DLC
    napcat update                         更新 NAPCAT及QQ
    napcat rebuild                        重建 NAPCAT及QQ
    napcat remove                         卸载 NAPCAT及QQ
    napcat help                           查看此帮助
    napcat oldhelp                        查看旧方法(若此脚本不生效)
```

输入`sudo napcat start ████████`启动我的QQ小号，再输入`sudo napcat log ████████`查看日志进行扫码登录

```bash
02-22 21:51:58 [debug] 本账号数据/缓存目录： /root/.config/QQ/NapCat/data
02-22 21:51:59 [debug] [Core] [Config] 配置文件/opt/QQ/resources/app/app_launcher/napcat/config/napcat_████████.json加载 {"fileLog":false,"consoleLog":true,"fileLogLevel":"debug","consoleLogLevel":"info","packetBackend":"auto","packetServer":""}
```

此外，还可以进入http://████████:6099/ 从而进入WebUI，进入时需要输入token，在`/opt/QQ/resources/app/app_launcher/napcat/config/webui.json`可以找到，是`napcat`，安全起见，我将Token也就是密码改为了`██`。

能用，但是QQ号被封了。😭
