declare module 'js-yaml' {
  export function load(content: string): any;
  export function dump(obj: any): string;
}

declare module 'qrcode' {
  export function toDataURL(text: string): Promise<string>;
  export function toString(text: string): Promise<string>;
}

declare module 'ln-service' {
  export function createInvoice(params: any): Promise<any>;
  export function getInvoice(params: any): Promise<any>;
  export function payInvoice(params: any): Promise<any>;
}

declare module '@react-native-netinfo/netinfo' {
  export function addEventListener(listener: (state: any) => void): () => void;
  export function fetch(): Promise<any>;
}

declare module 'react-native-sqlite-storage' {
  export function openDatabase(params: any): any;
}

declare module 'crypto-js' {
  export function encrypt(text: string, key: string): any;
  export function decrypt(encrypted: any, key: string): any;
}

declare module 'bip39' {
  export function generateMnemonic(): string;
  export function mnemonicToSeed(mnemonic: string): Buffer;
}

declare module 'bip32' {
  export function fromSeed(seed: Buffer): any;
}

declare module '@heroicons/react/24/outline' {
  export const CheckIcon: any;
  export const XMarkIcon: any;
  export const ExclamationTriangleIcon: any;
  export const InformationCircleIcon: any;
}

declare module 'class-variance-authority' {
  export function cva(base?: string, config?: any): any;
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
}

declare module 'cmdk' {
  export const Command: any;
}

declare module '@radix-ui/react-context-menu' {
  export const Root: any;
  export const Trigger: any;
  export const Content: any;
  export const Item: any;
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

declare module 'vaul' {
  export const Drawer: any;
}

declare module '@radix-ui/react-dropdown-menu' {
  export const Root: any;
  export const Trigger: any;
  export const Content: any;
  export const Item: any;
}

declare module '@radix-ui/react-hover-card' {
  export const Root: any;
  export const Trigger: any;
  export const Content: any;
}

declare module 'input-otp' {
  export const Root: any;
  export const Group: any;
  export const Slot: any;
  export const Separator: any;
}

declare module '@radix-ui/react-label' {
  export const Root: any;
}

declare module 'react-hook-form' {
  export function useForm(): any;
  export function Controller(): any;
}

declare module '@radix-ui/react-menubar' {
  export const Root: any;
  export const Menu: any;
  export const Trigger: any;
  export const Content: any;
  export const Item: any;
}

declare module '@radix-ui/react-navigation-menu' {
  export const Root: any;
  export const List: any;
  export const Item: any;
  export const Trigger: any;
  export const Content: any;
}

declare module '@radix-ui/react-popover' {
  export const Root: any;
  export const Trigger: any;
  export const Content: any;
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

declare module 'react-resizable-panels' {
  export const PanelGroup: any;
  export const Panel: any;
  export const PanelResizeHandle: any;
}

declare module '@radix-ui/react-scroll-area' {
  export const Root: any;
  export const Viewport: any;
  export const Scrollbar: any;
  export const Thumb: any;
}

declare module '@radix-ui/react-select' {
  export const Root: any;
  export const Trigger: any;
  export const Value: any;
  export const Content: any;
  export const Item: any;
}

declare module '@radix-ui/react-icons' {
  export const ChevronDownIcon: any;
  export const CheckIcon: any;
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

declare module 'next-themes' {
  export function useTheme(): any;
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
  export const Content: any;
}

declare module 'react-day-picker' {
  export const DayPicker: any;
}

declare module 'embla-carousel-react' {
  export const useEmblaCarousel: any;
}

declare module 'recharts' {
  export const ResponsiveContainer: any;
  export const LineChart: any;
  export const Line: any;
  export const XAxis: any;
  export const YAxis: any;
  export const CartesianGrid: any;
  export const Tooltip: any;
  export const Legend: any;
}

declare module 'date-fns' {
  export function format(date: Date, formatStr: string): string;
  export function parseISO(dateString: string): Date;
}

declare module 'date-fns/locale' {
  export const enUS: any;
  export const fr: any;
}

declare module '@tailwindcss/vite' {
  export default function tailwindcss(): any;
}

declare module '@vitejs/plugin-react' {
  export default function react(): any;
}

declare module 'react-dom/client' {
  export function createRoot(container: Element): any;
}