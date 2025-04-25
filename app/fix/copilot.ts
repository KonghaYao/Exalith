"use client"
// 修复 copilot 的 constructFinalMessages 函数官方的操作删除了没有父级 id 的message
function constructFinalMessages(
  syncedMessages: any[],
  previousMessages: any[],
  newMessages: any[],
) {
  const finalMessage = [...previousMessages, ...newMessages];
  const diffMessages = syncedMessages.filter(
    (message) => !finalMessage.some((m) => m.id === message.id),
  );
  return [...finalMessage, ...diffMessages];
  //   const finalMessages =
  //     syncedMessages.length > 0
  //       ? [...syncedMessages]
  //       : [...previousMessages, ...newMessages];
  //   if (syncedMessages.length > 0) {
  //     const messagesWithAgentState = [...previousMessages, ...newMessages];
  //     let previousMessageId = void 0;
  //     for (const message of messagesWithAgentState) {
  //       if (message.isAgentStateMessage()) {
  //         const index = finalMessages.findIndex(
  //           (msg) => msg.id === previousMessageId,
  //         );
  //         if (index !== -1) {
  //           finalMessages.splice(index + 1, 0, message);
  //         }
  //       }
  //       previousMessageId = message.id;
  //     }
  //   }
  //   return finalMessages;
}
globalThis.window && (globalThis.window.constructFinalMessages = constructFinalMessages);
