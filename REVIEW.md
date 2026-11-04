# How our plugin passed OpenAI review

Plugin: [Ladder by Aizhan Li](https://chatgpt.com/plugins/plugin_asdk_app_6ada41b9737081919d0b0cd3b582b3c4).
Server: `https://108psy.com/mcp`, two read-only tools, no sign-in.
Submitted on 22 October 2026, approved on 4 November 2026, published the same day.

This is what we did, in order. It is our experience, not official guidance;
check the current OpenAI documentation before you submit.

## 1. Why a plugin and not a GPT

On 20 October 2026 OpenAI updated its help article on GPTs: on personal plans (Free, Go, Plus, Pro)
new GPTs can no longer be created or published, and plugins take their place.
Our GPT stayed a private draft, so we moved the same idea into an MCP server.

## 2. Decide what the plugin will never do

We wrote this list before any code, and every later step checked against it:

- no prices, plans, payments or links to checkout pages inside the plugin;
- no diagnoses, symptoms, illnesses or medication;
- no accounts, no sign-in, nothing stored or logged;
- signs of crisis or violence lead to helpline numbers instead of a reading.

For a wellbeing topic this list mattered more than any feature.

## 3. Build the smallest server

Two tools, both read-only. One returns the questions, one returns the reading.
No language model inside the server: the reading is computed by fixed rules,
so the same answers always give the same result. This repository shows the same pattern with one tool.

## 4. Write the tool descriptions as a contract

Each description says what the tool does, when to use it, what to pass and what it returns,
and also when not to use it. Annotations mark both tools read-only, not destructive and closed world.
We treat these texts as an agreement with the reviewer: after publication we change them only
together with a new submission.

## 5. Prepare the pages the form asks for

- privacy policy that names the plugin, what it receives and that it stores nothing
  (we updated ours in Russian, Kazakh and English);
- support page with a way to ask about the plugin;
- terms of service;
- website on the same domain as the server.

## 6. Verify the domain

The OpenAI Platform dashboard gives a token. The server must return exactly that token as plain text at
`/.well-known/openai-apps-challenge`. We keep the token as a secret, not in the code.

## 7. Fill in the submission package

`plugin.json` holds the display name, short and long descriptions, category, capabilities,
links, three default prompts, brand colour, logo and translations (we added Russian and Kazakh).
`mcp.json` points to the server and says `auth: none`. A template is in [example/](example/).

## 8. Write test cases for the reviewer

Five positive cases (a start in Russian, a full reading in Russian, a reading in English,
a Kazakh flow, and a crisis case that must return helplines) and three negative ones
(a health question, a purchase request, a request for other people's data).
Each case has the prompt, the tools that should run and the expected behaviour.
We also set `commerce: false` with a one-line explanation.

## 9. Record a walkthrough

A short screen recording of the plugin running in ChatGPT: the questions, a reading, the crisis case.

## 10. Wait, then publish yourself

The manual review took about two weeks. The approval came by email,
and the plugin went live only after we pressed Publish in the dashboard.

## What we would tell someone starting now

- Keep the first version small. Two tools were enough.
- Write the "never" list first. It answers most review questions in advance.
- Make negative test cases as carefully as positive ones.
- Do not let the plugin sell. Link to your site for depth, not to a payment page.
- Write tests for the protocol itself: wrong JSON, unknown method, unknown tool, oversized body.
