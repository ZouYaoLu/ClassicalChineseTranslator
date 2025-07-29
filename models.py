import yaml
import requests
from typing import Dict

class ModelHandler:
    """Handle calls to different LLM providers based on YAML config."""

    def __init__(self, config_path: str = "config.yaml"):
        self.load_config(config_path)

    # ---------------------------------------------------------------------
    # Config helpers
    # ---------------------------------------------------------------------
    def load_config(self, path: str):
        with open(path, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
        self.default_model = cfg.get("default_model") or cfg["models"][0]["name"]
        self._model_map: Dict[str, Dict] = {m["name"]: m for m in cfg["models"]}

    # ---------------------------------------------------------------------
    # Public API
    # ---------------------------------------------------------------------
    def call(self, text: str, model_name: str | None = None) -> str:
        model_cfg = self._model_map.get(model_name or self.default_model)
        if not model_cfg:
            raise ValueError("Unknown model name")

        prompt = model_cfg["prompt_template"].format(text=text)
        provider = model_cfg["provider"].lower()

        if provider == "alibaba":
            return self._call_alibaba(model_cfg, prompt)
        elif provider == "openai":
            return self._call_openai(model_cfg, prompt)
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    # ------------------------------------------------------------------
    # Provider implementations
    # ------------------------------------------------------------------
    def _call_alibaba(self, cfg: Dict, prompt: str) -> str:
        url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {cfg['api_key']}",
        }
        payload = {"model": cfg["model"], "input": {"text": prompt}}
        resp = requests.post(url, json=payload, headers=headers, timeout=120)
        resp.raise_for_status()
        data = resp.json()
        # The exact response schema may differ; adjust as needed.
        return (
            data.get("output", {}).get("text")
            or data.get("choices", [{}])[0].get("text", "")
        )

    def _call_openai(self, cfg: Dict, prompt: str) -> str:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {cfg['api_key']}",
        }
        payload = {
            "model": cfg["model"],
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        }
        resp = requests.post(url, json=payload, headers=headers, timeout=120)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()