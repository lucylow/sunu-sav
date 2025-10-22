// types/missing-modules.d.ts
declare module 'ln-service' {
  export interface LndConfig {
    cert?: string;
    macaroon?: string;
    socket?: string;
  }

  export interface Invoice {
    id: string;
    payment_request: string;
    payment_hash: string;
    amount: number;
    memo?: string;
    expiry: number;
    created_at: string;
  }

  export interface Payment {
    id: string;
    payment_hash: string;
    payment_request: string;
    status: string;
    amount: number;
    fee_msat: number;
    timestamp: string;
  }

  export function createInvoice(config: LndConfig, options: any): Promise<Invoice>;
  export function payInvoice(config: LndConfig, options: any): Promise<Payment>;
  export function getInvoice(config: LndConfig, options: any): Promise<Invoice>;
  export function getPayment(config: LndConfig, options: any): Promise<Payment>;
}

declare module 'hex-lite' {
  export function hexToBytes(hex: string): Uint8Array;
  export function bytesToHex(bytes: Uint8Array): string;
}

declare module '@react-native-netinfo/netinfo' {
  export interface NetInfoState {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    type: string | null;
  }

  export function addEventListener(listener: (state: NetInfoState) => void): () => void;
  export function fetch(): Promise<NetInfoState>;
  export function getCurrentState(): Promise<NetInfoState>;
}

declare module 'aws-sdk' {
  export class KMS {
    constructor(config?: any);
    decrypt(params: any): any;
    encrypt(params: any): any;
  }
}

declare module 'class-variance-authority' {
  export function cva(base?: string, config?: any): any;
  export function cx(...inputs: any[]): string;
  export interface VariantProps<T> {
    [key: string]: any;
  }
}

declare module '@radix-ui/react-accordion' {
  export const Root: any;
  export const Item: any;
  export const Header: any;
  export const Trigger: any;
  export const Content: any;
}

declare module '@radix-ui/react-alert-dialog' {
  export const Root: any;
  export const Trigger: any;
  export const Portal: any;
  export const Overlay: any;
  export const Content: any;
  export const Title: any;
  export const Description: any;
  export const Action: any;
  export const Cancel: any;
}

declare module '@radix-ui/react-aspect-ratio' {
  export const Root: any;
}

declare module '@radix-ui/react-avatar' {
  export const Root: any;
  export const Image: any;
  export const Fallback: any;
}

declare module '@radix-ui/react-checkbox' {
  export const Root: any;
  export const Indicator: any;
}

declare module '@radix-ui/react-collapsible' {
  export const Root: any;
  export const Trigger: any;
  export const Content: any;
  export const CollapsibleTrigger: any;
  export const CollapsibleContent: any;
}

declare module '@radix-ui/react-context-menu' {
  export const Root: any;
  export const Trigger: any;
  export const Portal: any;
  export const Content: any;
  export const Item: any;
  export const Group: any;
  export const Sub: any;
  export const RadioGroup: any;
  export const SubTrigger: any;
  export const SubContent: any;
  export const CheckboxItem: any;
  export const ItemIndicator: any;
  export const RadioItem: any;
  export const Label: any;
  export const Separator: any;
}

declare module '@radix-ui/react-dialog' {
  export const Root: any;
  export const Trigger: any;
  export const Portal: any;
  export const Overlay: any;
  export const Content: any;
  export const Title: any;
  export const Description: any;
  export const Close: any;
}

declare module '@radix-ui/react-dropdown-menu' {
  export const Root: any;
  export const Trigger: any;
  export const Portal: any;
  export const Content: any;
  export const Item: any;
  export const Group: any;
  export const CheckboxItem: any;
  export const ItemIndicator: any;
  export const RadioGroup: any;
  export const RadioItem: any;
  export const Label: any;
  export const Separator: any;
  export const Sub: any;
  export const SubTrigger: any;
  export const SubContent: any;
}

declare module '@radix-ui/react-hover-card' {
  export const Root: any;
  export const Trigger: any;
  export const Portal: any;
  export const Content: any;
}

declare module '@radix-ui/react-label' {
  export const Root: any;
}

declare module '@radix-ui/react-menubar' {
  export const Root: any;
  export const Menu: any;
  export const Trigger: any;
  export const Portal: any;
  export const Content: any;
  export const Item: any;
  export const Group: any;
  export const RadioGroup: any;
  export const CheckboxItem: any;
  export const ItemIndicator: any;
  export const RadioItem: any;
  export const Label: any;
  export const Separator: any;
  export const Sub: any;
  export const SubTrigger: any;
  export const SubContent: any;
}

declare module '@radix-ui/react-navigation-menu' {
  export const Root: any;
  export const List: any;
  export const Item: any;
  export const Trigger: any;
  export const Content: any;
  export const Link: any;
  export const Viewport: any;
  export const Indicator: any;
}

declare module '@radix-ui/react-popover' {
  export const Root: any;
  export const Trigger: any;
  export const Portal: any;
  export const Content: any;
  export const Anchor: any;
}

declare module '@radix-ui/react-progress' {
  export const Root: any;
  export const Indicator: any;
}

declare module '@radix-ui/react-radio-group' {
  export const Root: any;
  export const Item: any;
  export const Indicator: any;
}

declare module '@radix-ui/react-scroll-area' {
  export const Root: any;
  export const Viewport: any;
  export const Scrollbar: any;
  export const Thumb: any;
  export const Corner: any;
  export const ScrollAreaScrollbar: any;
  export const ScrollAreaThumb: any;
}

declare module '@radix-ui/react-select' {
  export const Root: any;
  export const Trigger: any;
  export const Portal: any;
  export const Content: any;
  export const Item: any;
  export const Group: any;
  export const Value: any;
  export const Icon: any;
  export const ScrollUpButton: any;
  export const ScrollDownButton: any;
  export const Viewport: any;
  export const Label: any;
  export const ItemIndicator: any;
  export const ItemText: any;
  export const Separator: any;
}

declare module '@radix-ui/react-separator' {
  export const Root: any;
}

declare module '@radix-ui/react-slider' {
  export const Root: any;
  export const Track: any;
  export const Range: any;
  export const Thumb: any;
}

declare module '@radix-ui/react-switch' {
  export const Root: any;
  export const Thumb: any;
}

declare module '@radix-ui/react-tabs' {
  export const Root: any;
  export const List: any;
  export const Trigger: any;
  export const Content: any;
}

declare module '@radix-ui/react-toggle-group' {
  export const Root: any;
  export const Item: any;
}

declare module '@radix-ui/react-toggle' {
  export const Root: any;
}

declare module '@radix-ui/react-tooltip' {
  export const Root: any;
  export const Trigger: any;
  export const Portal: any;
  export const Content: any;
  export const Provider: any;
  export const Arrow: any;
}

declare module '@radix-ui/react-icons' {
  export const ChevronDownIcon: any;
  export const CheckIcon: any;
  export const ChevronUpIcon: any;
}

declare module 'react-day-picker' {
  export const DayPicker: any;
  export const SelectSingleEventHandler: any;
  export const SelectMultipleEventHandler: any;
  export const SelectRangeEventHandler: any;
  export const DayButton: any;
  export const getDefaultClassNames: any;
}

declare module 'embla-carousel-react' {
  export const useEmblaCarousel: any;
  export const EmblaCarouselType: any;
  export const UseEmblaCarouselType: any;
}

declare module 'recharts' {
  export const LineChart: any;
  export const Line: any;
  export const XAxis: any;
  export const YAxis: any;
  export const CartesianGrid: any;
  export const Tooltip: any;
  export const ResponsiveContainer: any;
  export const BarChart: any;
  export const Bar: any;
  export const PieChart: any;
  export const Pie: any;
  export const Cell: any;
  export const Legend: any;
  export interface LegendProps {
    [key: string]: any;
  }
}

declare module 'cmdk' {
  export const Command: any;
}

declare module 'vaul' {
  export const Drawer: any;
}

declare module 'input-otp' {
  export const OTPInput: any;
  export const OTPInputContext: any;
}

declare module 'react-hook-form' {
  export const useForm: any;
  export const Controller: any;
  export const FormProvider: any;
  export const useFormContext: any;
  export const useFormState: any;
  export const ControllerProps: any;
  export const FieldPath: any;
  export const FieldValues: any;
}

declare module 'react-resizable-panels' {
  export const PanelGroup: any;
  export const Panel: any;
  export const PanelResizeHandle: any;
}

declare module 'next-themes' {
  export const ThemeProvider: any;
  export const useTheme: any;
}

declare module '@heroicons/react/24/outline' {
  export const ChevronDownIcon: any;
  export const CheckIcon: any;
  export const PlusIcon: any;
  export const XMarkIcon: any;
  export const TrashIcon: any;
  export const PencilIcon: any;
  export const EyeIcon: any;
  export const EyeSlashIcon: any;
  export const BoltIcon: any;
  export const CurrencyDollarIcon: any;
  export const ClockIcon: any;
  export const UsersIcon: any;
  export const CalendarIcon: any;
  export const ArrowPathIcon: any;
  export const ExclamationTriangleIcon: any;
  export const CheckCircleIcon: any;
  export const XCircleIcon: any;
  export const InformationCircleIcon: any;
  export const ArrowRightIcon: any;
  export const ArrowLeftIcon: any;
  export const HomeIcon: any;
  export const WalletIcon: any;
  export const CogIcon: any;
  export const UserIcon: any;
  export const BellIcon: any;
  export const MagnifyingGlassIcon: any;
  export const Bars3Icon: any;
  export const XMarkIcon: any;
  export const ChevronLeftIcon: any;
  export const ChevronRightIcon: any;
  export const ChevronUpIcon: any;
  export const ChevronDownIcon: any;
  export const PlusIcon: any;
  export const MinusIcon: any;
  export const StarIcon: any;
  export const HeartIcon: any;
  export const ShareIcon: any;
  export const BookmarkIcon: any;
  export const FlagIcon: any;
  export const TagIcon: any;
  export const FolderIcon: any;
  export const DocumentIcon: any;
  export const PhotoIcon: any;
  export const VideoIcon: any;
  export const MusicIcon: any;
  export const ArchiveIcon: any;
  export const TrashIcon: any;
  export const PencilIcon: any;
  export const EyeIcon: any;
  export const EyeSlashIcon: any;
  export const LockClosedIcon: any;
  export const LockOpenIcon: any;
  export const KeyIcon: any;
  export const ShieldCheckIcon: any;
  export const ShieldExclamationIcon: any;
  export const ExclamationTriangleIcon: any;
  export const CheckCircleIcon: any;
  export const XCircleIcon: any;
  export const InformationCircleIcon: any;
  export const QuestionMarkCircleIcon: any;
  export const LightBulbIcon: any;
  export const FireIcon: any;
  export const BoltIcon: any;
  export const SunIcon: any;
  export const MoonIcon: any;
  export const CloudIcon: any;
  export const CloudRainIcon: any;
  export const CloudSnowIcon: any;
  export const CloudSunIcon: any;
  export const CloudMoonIcon: any;
  export const CloudLightningIcon: any;
  export const CloudFogIcon: any;
  export const CloudDrizzleIcon: any;
  export const CloudHailIcon: any;
  export const CloudSleetIcon: any;
  export const CloudWindIcon: any;
  export const CloudArrowUpIcon: any;
  export const CloudArrowDownIcon: any;
  export const CloudCheckIcon: any;
  export const CloudXMarkIcon: any;
  export const CloudExclamationIcon: any;
  export const CloudQuestionMarkIcon: any;
  export const CloudLightBulbIcon: any;
  export const CloudFireIcon: any;
  export const CloudBoltIcon: any;
  export const CloudSunIcon: any;
  export const CloudMoonIcon: any;
  export const CloudCloudIcon: any;
  export const CloudCloudRainIcon: any;
  export const CloudCloudSnowIcon: any;
  export const CloudCloudSunIcon: any;
  export const CloudCloudMoonIcon: any;
  export const CloudCloudLightningIcon: any;
  export const CloudCloudFogIcon: any;
  export const CloudCloudDrizzleIcon: any;
  export const CloudCloudHailIcon: any;
  export const CloudCloudSleetIcon: any;
  export const CloudCloudWindIcon: any;
  export const CloudCloudArrowUpIcon: any;
  export const CloudCloudArrowDownIcon: any;
  export const CloudCloudCheckIcon: any;
  export const CloudCloudXMarkIcon: any;
  export const CloudCloudExclamationIcon: any;
  export const CloudCloudQuestionMarkIcon: any;
  export const CloudCloudLightBulbIcon: any;
  export const CloudCloudFireIcon: any;
  export const CloudCloudBoltIcon: any;
  export const CloudCloudSunIcon: any;
  export const CloudCloudMoonIcon: any;
  export const TrophyIcon: any;
  export const LightningBoltIcon: any;
  export const UserPlusIcon: any;
}

declare module 'date-fns' {
  export function format(date: Date, formatStr: string): string;
  export function parseISO(dateString: string): Date;
  export function addDays(date: Date, amount: number): Date;
  export function subDays(date: Date, amount: number): Date;
  export function isAfter(date: Date, dateToCompare: Date): boolean;
  export function isBefore(date: Date, dateToCompare: Date): boolean;
  export function isEqual(date: Date, dateToCompare: Date): boolean;
  export function isToday(date: Date): boolean;
  export function isYesterday(date: Date): boolean;
  export function isTomorrow(date: Date): boolean;
  export function startOfDay(date: Date): Date;
  export function endOfDay(date: Date): Date;
  export function startOfWeek(date: Date): Date;
  export function endOfWeek(date: Date): Date;
  export function startOfMonth(date: Date): Date;
  export function endOfMonth(date: Date): Date;
  export function startOfYear(date: Date): Date;
  export function endOfYear(date: Date): Date;
  export function differenceInDays(dateLeft: Date, dateRight: Date): number;
  export function differenceInHours(dateLeft: Date, dateRight: Date): number;
  export function differenceInMinutes(dateLeft: Date, dateRight: Date): number;
  export function differenceInSeconds(dateLeft: Date, dateRight: Date): number;
  export function differenceInMilliseconds(dateLeft: Date, dateRight: Date): number;
}

declare module 'date-fns/locale' {
  export const enUS: any;
  export const fr: any;
  export const es: any;
  export const de: any;
  export const it: any;
  export const pt: any;
  export const ru: any;
  export const ja: any;
  export const ko: any;
  export const zh: any;
  export const ar: any;
  export const hi: any;
  export const th: any;
  export const vi: any;
  export const tr: any;
  export const pl: any;
  export const nl: any;
  export const sv: any;
  export const da: any;
  export const no: any;
  export const fi: any;
  export const cs: any;
  export const hu: any;
  export const ro: any;
  export const bg: any;
  export const hr: any;
  export const sk: any;
  export const sl: any;
  export const et: any;
  export const lv: any;
  export const lt: any;
  export const uk: any;
  export const be: any;
  export const mk: any;
  export const sr: any;
  export const sq: any;
  export const mt: any;
  export const cy: any;
  export const ga: any;
  export const is: any;
  export const fo: any;
  export const kl: any;
  export const se: any;
  export const sma: any;
  export const smj: any;
  export const smn: any;
  export const sms: any;
  export const sme: any;
  export const smi: any;
  export const sma: any;
  export const smj: any;
  export const smn: any;
  export const sms: any;
  export const sme: any;
  export const smi: any;
  export const zhCN: any;
}

declare module 'tiny-secp256k1' {
  export function sign(message: Buffer, privateKey: Buffer): Buffer;
  export function verify(message: Buffer, signature: Buffer, publicKey: Buffer): boolean;
  export function publicKeyCreate(privateKey: Buffer): Buffer;
  export function publicKeyConvert(publicKey: Buffer): Buffer;
}

declare module 'debug' {
  export default function debug(namespace: string): any;
}

declare module '../database' {
  export const db: any;
}

declare module '../jobs/aiJobManager' {
  export const aiJobManager: any;
}

declare module '../utils/audit' {
  export const auditLog: any;
}

declare module '../storage/db.js' {
  export const db: any;
}

declare module '../../ai/mockAiClient.js' {
  export class MockAiClient {
    constructor();
    getCreditScore(userId: string): Promise<any>;
    getFraudAlerts(userId: string): Promise<any>;
    getAgentRecommendations(userId: string): Promise<any>;
    getInflationData(): Promise<any>;
    getMicrotaskRewards(userId: string): Promise<any>;
    getPayoutExplanation(groupId: string, cycle: number): Promise<any>;
    getPredictiveData(userId: string): Promise<any>;
    getReminderSchedule(userId: string): Promise<any>;
    getRoutingOptimization(groupId: string): Promise<any>;
    chat(message: string, context?: any): Promise<any>;
  }
  export const mockAiClient: MockAiClient;
  export default MockAiClient;
}
