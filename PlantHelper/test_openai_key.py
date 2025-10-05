import os
import httpx

# Read your API key from environment
key = os.getenv("OPENAI_API_KEY")
print("OPENAI_API_KEY present?", bool(key))

if not key:
    print("No key found! Set OPENAI_API_KEY in your environment or .env file.")
else:
    try:
        # Test the key by calling the models endpoint
        resp = httpx.get(
            "https://api.openai.com/v1/models",
            headers={"Authorization": f"Bearer {key}"}
        )
        print("Status code:", resp.status_code)
        print("Response snippet:", resp.text[:500])
    except Exception as e:
        print("Error calling OpenAI API:", e)
