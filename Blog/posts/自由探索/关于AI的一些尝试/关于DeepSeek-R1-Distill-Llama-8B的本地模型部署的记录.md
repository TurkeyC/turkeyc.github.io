--- 
title: 关于DeepSeek-R1的本地模型部署的记录
date:2025-02-08
tags:[开发日志,AI]
category:原创 
pinned: false
---

# 关于DeepSeek-R1-Distill-Llama-8B的本地模型部署

在 https://lmstudio.ai/ 下载了 LMStudio，这是一款**非开源**的支持本地部署大模型的应用；

将LMStudio安装在了 `"E:\Program_Files\LM_Studio_AI\LM Studio"` ；

并设置模型文件路径为 `"E:\Program_Files\LM_Studio_AI\My_AI_Models"` ；

然后由于该软件**闭源**，因此进行以下操作将其联网权限彻底封禁（虽然国内本然就连不了网）

> 打开`高级安全 Windows Defender 防火墙` ；
>
> 点击左侧栏中的`入站规则` ，在右侧栏中选择`新建规则` ；
>
> 将`E:\Program_Files\LM_Studio_AI\LM Studio\LM Studio.exe`封禁，命名规则为：`LM Studio 主体禁止联网`；
>
> 将`E:\Program_Files\LM_Studio_AI\LM Studio\resources\elevate.exe`封禁，命名规则为：`LM Studio 主体禁止联网`；
>
> 将`E:\Program_Files\LM_Studio_AI\LM Studio\resources\elevate.exe`封禁，命名规则为：`LM Studio 提权程序elevate禁止联网`；
>
> 将`%USERPROFILE%\.lmstudio\bin\lms.exe` 即`C:\Users\Cao_Turkey_Su\.lmstudio\bin\lms.exe` 封禁，命名规则为：`LM Studio 运行时程序lms禁止联网`；
>
> 将`%USERPROFILE%\.lmstudio\.internal\utils\esbuild.exe` 封禁，命名规则为：`LM Studio 运行时程序esbuild禁止联网`；
>
> 将`%USERPROFILE%\.lmstudio\.internal\utils\node.exe` 封禁，命名规则为：`LM Studio 运行时程序node禁止联网`；
>
> 出站规则同理一样禁用。

然后进入https://hf-mirror.com/（HuggingFace的镜像站），搜索`DeepSeek-R1`，进入蒸馏模型，在搜索框中搜索`Llama 8B GGUF `，选择目前下载量最高的 [unsloth/DeepSeek-R1-Distill-Llama-8B-GGUF](https://hf-mirror.com/unsloth/DeepSeek-R1-Distill-Llama-8B-GGUF) 下载了8B-Q8_0模型和8B-Q4_K_M模型

好了，这样就可以把之前下的`ChatGLM3-6B`删掉啦！`E:\Program_Files\ChatGLM3-6B-OneKey`完成了它从1月15号开始的使命。