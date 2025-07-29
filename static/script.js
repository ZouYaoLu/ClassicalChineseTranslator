async function translate() {
  const text = document.getElementById("input").value.trim();
  if (!text) {
    alert("请输入需要翻译的内容");
    return;
  }
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || res.statusText);
    }
    const data = await res.json();
    document.getElementById("output").value = data.translation;
  } catch (err) {
    alert("翻译失败：" + err.message);
  }
}

document.getElementById("translateBtn").addEventListener("click", translate);

document.getElementById("copyBtn").addEventListener("click", () => {
  const output = document.getElementById("output");
  if (!output.value) return;
  output.select();
  document.execCommand("copy");
  alert("已复制到剪贴板");
});

document.getElementById("readBtn").addEventListener("click", () => {
  const text = document.getElementById("output").value;
  if (!text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "zh-CN";
  speechSynthesis.speak(utter);
});