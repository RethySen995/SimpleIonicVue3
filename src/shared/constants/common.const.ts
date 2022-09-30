export enum BUTTON_ROLE {
    OK = "ok",
    CONFIRM = "confirm",
    CANCEL = "cancel",
    CLOSE = "close",
    NEXT = "next",
    PRE = "pre",
    APPLY = "apply",
    YES = "yes",
    NO = "no",
    BACKDROP = "backdrop",
  }
export type DateFormat = 'hhmm' |
                          'hhmmss' |
                          'hhmmssSSS'|
                          'yyyymmdd' |
                          'yyyymmddhhmm' |
                          'yyyymmddhhmmss' |
                          'yyyymmddhhmmssSSS' |
                          'yyyy-mm-dd';
export type SegmentPeriodOptionValue = 'tab_1w' | 'tab_1m' | 'tab_3m' | 'tab_6m';
export type DateTypePerriod = 'weeks' | 'months';
export enum PeriodDateOptionValue {
  ONE_WEEK = "tab_1w",
  ONE_MONTH = "tab_1m",
  THREE_MONTH = "tab_3m",
  SIX_MONTH = "tab_6m",
}