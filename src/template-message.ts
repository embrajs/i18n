import type { TFunctionArgs } from "./interface";

export type TemplateMessageFn = (args: TFunctionArgs) => string;

export type LocaleTemplateMessageFns = Record<string, TemplateMessageFn | false>;

/**
 * Create an interpreter function for template locale message.
 *
 * `"a {{b}} c"` => `` `a ${args.b} c` ``
 */
export const createTemplateMessageFn = (message: string): TemplateMessageFn | false => {
  const slices: string[] = [];
  const keys: string[] = [];
  const matchArgs = /{{(\S+?)}}/g;
  let slice: RegExpExecArray | null;
  let pointer = 0;
  while ((slice = matchArgs.exec(message))) {
    slices.push(message.slice(pointer, slice.index), "");
    keys.push(slice[1]);
    pointer = slice.index + slice[0].length;
  }
  slices.push(message.slice(pointer));

  if (keys.length <= 0) {
    return false;
  }

  return (args: TFunctionArgs): string => {
    for (let i = 0; i < keys.length; i++) {
      slices[i * 2 + 1] = args[keys[i]] ?? `{{${keys[i]}}}`;
    }
    return slices.join("");
  };
};
