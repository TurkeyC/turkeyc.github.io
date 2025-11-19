首先是关于虚拟声卡Voicemeeter的配置

跟随教程：https://docs.qq.com/doc/DUkJ2QU96Z3VlUGFU?u=f510d39a520e4c97826eda9ce16fecdd&nlc=1

运行`Voicemeeter8Setup.exe`安装虚拟声卡，默认安装在C盘 :(

在系统设置中，将VoiceMeeter Output设置为默认的音频录制设备，将原来的扬声器或耳机设置为默认的音频播放设备

运行"C:\Program Files (x86)\VB\Voicemeeter\voicemeeter.exe"，按照教程进行调试

---

然后是RVC-Realtime的调试

跟随教程：https://docs.qq.com/doc/DUnZiZENqT2llQnJt

运行"E:\Program_Files\AI_Software\Voice_Clone\RVC(Retrieval-based-Voice-Conversion)\RVC1006Nvidia\go-realtime-gui.bat"，
选择pth文件和index文件，
输入选择实际的硬件麦克风(MME)
输出选择虚拟声卡输出线路VoiceMeeter Input (VB-Audio Voi (MME)。

然后配置参数就好了
