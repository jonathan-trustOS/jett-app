interface Message {
    role: 'user' | 'assistant'
    content: string
  }
  
  export async function sendMessage(
    apiKey: string,
    messages: Message[],
    screenshot?: string | null,
    provider?: string
  ): Promise<string> {
    const result = await window.jett.claudeApi(
      apiKey, 
      JSON.stringify(messages), 
      screenshot || undefined,
      provider
    )
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    return result.text
  }