import { UserMessageProps } from "@copilotkit/react-ui";
export default (props: UserMessageProps) => {
  const wrapperStyles = "flex items-center gap-2 justify-end mb-4";
  const messageStyles =
    "text-black py-2 px-4 break-words flex-shrink-0 max-w-[80%] border-b-2 border-gradient-cool-b";
  return (
    <div className={wrapperStyles} style={{ fontFamily: "LXGW WenKai Light" }}>
      <div
        className={messageStyles}
        dangerouslySetInnerHTML={{
          __html: props.message?.replace(/\n/g, "<br/>") || "",
        }}
      ></div>
    </div>
  );
};
