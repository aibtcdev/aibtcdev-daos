// set to true to enable logging
const DEBUG_ENABLED = false;
// interface for the dbgLog params
export interface DbgLogParams {
  forceLog?: boolean;
  logType?: string;
  titleBefore?: string;
}
// helper function to log messages to the console
export function dbgLog(
  msg: unknown,
  params: {
    forceLog?: boolean;
    logType?: string;
    titleBefore?: string;
  } = {}
) {
  if (DEBUG_ENABLED || params.forceLog) {
    if (params.titleBefore) {
      console.log(params.titleBefore);
    }
    switch (params.logType) {
      case "error":
        console.error(msg);
        break;
      case "warn":
        console.warn(msg);
        break;
      case "info":
        console.info(msg);
        break;
      default:
        console.log(msg);
    }
  }
}
