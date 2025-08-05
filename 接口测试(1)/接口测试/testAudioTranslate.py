import requests


file_path = "E:\\testAudio\\40.amr.wav"

url = "http://10.10.63.78:6667/stt"

resp = requests.post(url, files={"file": open(file_path, 'rb')})

print(resp.json())
