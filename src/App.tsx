import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import { TonConnectUIProvider, TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import { 
  ShoppingBag, 
  User, 
  Settings, 
  LayoutDashboard, 
  Plus, 
  Trash2, 
  Package, 
  TrendingUp,
  Minus,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Check,
  Zap,
  Flame,
  Droplets,
  Disc,
  Tag,
  Search,
  Filter,
  Info,
  History,
  CreditCard,
  CheckCircle2,
  Clock,
  Send,
  Heart,
  Upload,
  Edit3,
  Database,
  Globe,
  Key,
  ShieldAlert
} from 'lucide-react';
import { cn } from './lib/utils';

// --- Types ---
interface Product {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  nicotine?: string;
  volume?: string;
  flavor?: string;
  is_sale: boolean;
  is_used: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface User {
  id: number;
  telegram_id: number;
  username: string;
  first_name: string;
  role: string;
  photo_url?: string;
  balance: number;
  total_spent?: number;
  total_orders?: number;
}

declare global {
  interface Window {
    onTelegramAuth: (user: any) => void;
  }
}

const TelegramLoginWidget = ({ botName, onAuth }: { botName: string, onAuth: (user: any) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.onTelegramAuth = onAuth;

    const script = document.createElement('script');
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute('data-telegram-login', botName.replace('@', ''));
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '15');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(script);
    }
    
    return () => {
      // Cleanup is important to prevent multiple widgets on re-renders
      if (containerRef.current) containerRef.current.innerHTML = '';
      // @ts-ignore
      delete window.onTelegramAuth;
    };
  }, [botName, onAuth]);

  return <div ref={containerRef} className="flex justify-center min-h-[54px]" />;
};

interface Order {
  id: number;
  user_id: number;
  status: string;
  total_price: number;
  items: string; // JSON string
  delivery_method?: string;
  delivery_address?: string;
  delivery_fee?: number;
  created_at: string;
  username?: string;
  first_name?: string;
}

// --- Components ---

// Add Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        close: () => void;
        expand: () => void;
        ready: () => void;
        MainButton: {
          text: string;
          show: () => void;
          onClick: (fn: () => void) => void;
        };
      };
    };
  }
}

interface AppSettings {
  yookassa_shop_id?: string;
  yookassa_api_key?: string;
  ton_payment_enabled?: boolean;
  ton_wallet_address?: string;
}

const Navbar = ({ user, cartCount, favoritesCount, tonEnabled }: { user: User | null, cartCount: number, favoritesCount: number, tonEnabled: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <nav className="sticky top-0 z-50 glass border-b border-[var(--color-glass-border)] h-20 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <span className="text-xl sm:text-2xl font-black tracking-widest text-[var(--color-portal-green)] uppercase">BARAHOLKA <span className="text-white">SHOP</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/catalog" className="text-xs uppercase tracking-widest font-bold hover:text-[var(--color-portal-green)] transition-colors">Каталог</Link>
            <Link to="/sale" className="text-xs uppercase tracking-widest font-bold text-red-500 hover:opacity-80 transition-opacity">СКИДКИ</Link>
          </div>

          <div className="flex items-center gap-4">
            {tonEnabled && (
              <div className="hidden lg:block scale-90">
                <TonConnectButton />
              </div>
            )}
            <Link to="/favorites" className="relative p-2 hover:bg-white/5 rounded-full transition-colors group">
              <Heart size={20} className="group-hover:text-red-500 transition-colors" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-red-500/40">
                  {favoritesCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--color-portal-green)] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-[var(--color-portal-green)]/40 animate-bounce">
                  {cartCount}
                </span>
              )}
            </Link>
            {user ? (
              <Link to="/profile" className="flex items-center gap-2 sm:gap-3 bg-white/5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/5 hover:border-[var(--color-portal-green)] transition-all max-w-[100px] sm:max-w-none">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-[var(--color-portal-green)] flex items-center justify-center font-bold text-black shrink-0 text-sm">
                  {user.first_name[0]}
                </div>
                <div className="hidden sm:block truncate">
                  <div className="text-[10px] font-bold leading-none truncate">{user.username || user.first_name}</div>
                </div>
              </Link>
            ) : (
              <Link to="/login" className="text-[10px] sm:text-xs font-bold bg-[var(--color-portal-green)] text-black px-4 sm:px-6 py-2 rounded-full hover:scale-105 transition-transform uppercase tracking-widest shadow-lg shadow-[var(--color-portal-green)]/20">
                ВХОД
              </Link>
            )}
            <button className="md:hidden text-white/50 hover:text-white" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 top-0 z-[60] bg-black/98 backdrop-blur-3xl md:hidden flex flex-col items-center justify-center p-10 gap-8"
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-8 right-8 p-4 bg-white/5 rounded-full hover:bg-white/10"
            >
              <X size={32} />
            </button>
            <div className="flex flex-col items-center gap-10">
              {[
                { label: 'Каталог', path: '/catalog' },
                { label: 'Избранное', path: '/favorites' },
                { label: 'Скидки', path: '/sale', className: 'text-red-500' },
                ...(user?.role === 'admin' ? [{ label: 'Админ Панель', path: '/admin', className: 'text-[var(--color-portal-green)]' }] : []),
                { label: 'Профиль', path: '/profile' }
              ].map((item, i) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link 
                    to={item.path} 
                    onClick={() => setIsOpen(false)} 
                    className={cn("text-5xl font-black uppercase tracking-tighter italic hover:text-[var(--color-portal-green)] transition-all hover:scale-110", item.className)}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              {tonEnabled && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="pt-10">
                  <TonConnectButton />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const HorizontalScroll = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 20);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 20);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      checkScroll();
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className={cn("relative group", className)}>
      <AnimatePresence>
        {showLeft && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => scroll('left')}
              className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-14 sm:h-14 bg-black/80 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center hover:bg-[var(--color-portal-green)] hover:text-black transition-all hover:scale-110 shadow-xl shadow-black/50"
            >
              <ChevronLeft size={24} />
            </motion.button>
        )}
      </AnimatePresence>
      <div 
        ref={scrollRef} 
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-0 py-2"
      >
        {children}
      </div>
      <AnimatePresence>
        {showRight && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => scroll('right')}
              className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-14 sm:h-14 bg-black/80 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center hover:bg-[var(--color-portal-green)] hover:text-black transition-all hover:scale-110 shadow-xl shadow-black/50"
            >
              <ChevronRight size={24} />
            </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

const ScrollIndicator = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-[var(--color-portal-green)] origin-left z-[100]"
      style={{ scaleX }}
    />
  );
};

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);
  const [atBottom, setAtBottom] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 500);
      setAtBottom(window.innerHeight + window.scrollY >= document.body.offsetHeight - 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-[90] flex flex-col gap-4">
      <AnimatePresence>
        {visible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-14 h-14 bg-[var(--color-portal-green)] text-black rounded-full flex items-center justify-center shadow-2xl shadow-[var(--color-portal-green)]/40 hover:scale-110 active:scale-95 transition-all outline-none"
          >
            <ChevronUp size={28} strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!atBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="w-12 h-12 bg-white/10 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all outline-none"
          >
            <ChevronDown size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

const StockInput = ({ initialStock, onUpdate }: { initialStock: number, onUpdate: (val: number) => void }) => {
  const [val, setVal] = useState<string>(initialStock.toString());
  
  useEffect(() => {
    setVal(initialStock.toString());
  }, [initialStock]);

  return (
    <input 
      type="number" 
      value={val}
      onFocus={(e) => {
        e.target.select();
        if (val === "0") setVal("");
      }}
      onBlur={() => {
        if (val === "") {
          setVal(initialStock.toString());
        } else {
          const num = parseInt(val);
          if (!isNaN(num)) onUpdate(num);
        }
      }}
      onChange={(e) => setVal(e.target.value)}
      className="w-12 bg-transparent text-center text-sm font-black focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-[var(--color-portal-green)]"
    />
  );
};
interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  onAddToCart: (p: Product) => void;
  onViewDetails: (p: Product) => void;
  onToggleFavorite: (productId: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isFavorite, onAddToCart, onViewDetails, onToggleFavorite }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass rounded-[35px] overflow-hidden group border border-[var(--color-glass-border)] hover:border-[var(--color-portal-green)]/50 transition-all p-4 relative flex flex-col h-full hover:shadow-[0_0_50px_rgba(68,255,0,0.1)]"
    >
      <div 
        onClick={() => onViewDetails(product)}
        className="aspect-[4/3] relative overflow-hidden bg-zinc-900 rounded-[28px] mb-6 flex items-center justify-center text-5xl cursor-pointer"
      >
        <div className="absolute top-3 left-3 z-20">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(product.id);
            }}
            className={cn(
              "p-2.5 rounded-2xl transition-all shadow-lg backdrop-blur-xl border",
              isFavorite 
                ? "bg-red-500 border-red-400 text-white" 
                : "bg-black/60 border-white/10 text-white/50 hover:text-white"
            )}
          >
            <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
          </motion.button>
        </div>

        {!!product.is_sale && (
          <motion.div 
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="absolute top-4 right-4 bg-red-600 text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest z-20 shadow-lg shadow-red-600/30"
          >
            SALE
          </motion.div>
        )}
        
        {!!product.is_used && (
          <div className="absolute bottom-4 left-4 bg-yellow-500/90 text-black text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest z-20 shadow-lg backdrop-blur-sm">
            Б/У
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-8 p-4">
          <div className="text-[10px] font-black tracking-widest bg-white text-black px-6 py-3 rounded-2xl scale-0 group-hover:scale-100 transition-transform uppercase">Просмотр</div>
        </div>
        
        {product.image_url ? (
          <motion.img 
            whileHover={{ scale: 1.15 }}
            transition={{ duration: 0.8 }}
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover transition-all grayscale group-hover:grayscale-0" 
            referrerPolicy="no-referrer" 
          />
        ) : (
          <div className="group-hover:scale-125 transition-transform duration-500">
            {product.category_name === 'Жижи' ? '🧪' : product.category_name === 'Подики' ? '🔋' : '💨'}
          </div>
        )}
      </div>
      
      <div className="space-y-4 flex-1 flex flex-col px-2">
        <div className="flex items-center gap-2">
          <div className="text-[9px] text-[var(--color-portal-green)] font-black uppercase tracking-[0.2em]">{product.category_name}</div>
          {product.stock <= 5 && product.stock > 0 && (
            <div className="text-[9px] text-red-500 font-black uppercase tracking-widest">МАЛО!</div>
          )}
        </div>
        
        <h3 className="font-black text-xl leading-tight tracking-tighter uppercase group-hover:text-[var(--color-portal-green)] transition-colors line-clamp-2 italic">{product.name}</h3>
        
        <div className="flex items-center justify-between mt-auto pt-4">
          <div className="flex flex-col">
            <span className="text-white/30 text-[9px] font-black uppercase tracking-widest">Цена</span>
            <span className="text-[var(--color-portal-green)] font-black text-2xl tracking-tighter">{product.price} ₽</span>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0}
            className="px-6 py-3 bg-white text-black text-[10px] uppercase font-black rounded-2xl hover:bg-[var(--color-portal-green)] transition-all shadow-xl disabled:grayscale disabled:opacity-30 disabled:hover:bg-white"
          >
            {product.stock > 0 ? 'КУПИТЬ' : 'НЕТУ'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const ProductModal = ({ product, onClose, onAddToCart, isFavorite, onToggleFavorite }: { 
  product: Product; 
  onClose: () => void; 
  onAddToCart: (p: Product) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.7, opacity: 0, y: 100, rotateX: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
        exit={{ scale: 0.7, opacity: 0, y: 100, rotateX: -30 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative glass max-w-2xl w-full max-h-[90vh] sm:max-h-none overflow-y-auto sm:overflow-visible rounded-[40px] overflow-hidden shadow-2xl border border-[var(--color-glass-border)]"
      >
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 bg-black/50 hover:bg-white/10 rounded-full z-[110] transition-colors"
        >
          <X size={24} className="text-white" />
        </motion.button>
        
        <div className="grid grid-cols-1 md:grid-cols-2">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="aspect-square bg-black/40 flex items-center justify-center text-8xl relative overflow-hidden"
          >
            <div className="absolute top-6 left-6 z-20">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(product.id);
                }}
                className={cn(
                  "p-3 rounded-2xl transition-all shadow-lg backdrop-blur-xl border",
                  isFavorite 
                    ? "bg-red-500 border-red-400 text-white" 
                    : "bg-black/60 border-white/10 text-white/50 hover:text-white"
                )}
              >
                <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
              </motion.button>
            </div>

            {!!product.is_sale && (
              <motion.div 
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="absolute top-6 right-6 bg-red-600 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest z-20 shadow-lg shadow-red-600/30"
              >
                SALE
              </motion.div>
            )}

            {!!product.is_used && (
              <div className="absolute bottom-6 left-6 bg-yellow-500/90 text-black text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest z-20 shadow-lg backdrop-blur-sm">
                Б/У
              </div>
            )}

            {product.image_url ? (
              <motion.img 
                layoutId={`product-image-${product.id}`}
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                {product.category_name === 'Жижи' ? '🧪' : product.category_name === 'Подики' ? '🔋' : '💨'}
              </motion.div>
            )}
          </motion.div>
          <div className="p-6 sm:p-10 space-y-6 flex flex-col justify-center">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <div className="text-[10px] text-[var(--color-portal-green)] font-black uppercase tracking-[0.3em]">{product.category_name}</div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tighter leading-tight uppercase font-sans italic italic-small">{product.name}</h2>
            </motion.div>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-zinc-400 text-sm leading-relaxed"
            >
              {product.description || 'Этот товар был добыт в ходе опасной вылазки в измерение 35-C. Рик гарантирует, что это лучшее, что вы пробовали в своей жалкой жизни.'}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="glass p-3 rounded-2xl bg-white/5">
                <div className="text-[8px] text-zinc-500 uppercase font-bold">Никотин</div>
                <div className="text-sm font-bold">{product.nicotine || 'N/A'}</div>
              </div>
              <div className="glass p-3 rounded-2xl bg-white/5">
                <div className="text-[8px] text-zinc-500 uppercase font-bold">Объем</div>
                <div className="text-sm font-bold">{product.volume || 'N/A'}</div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6"
            >
              <div className="text-4xl font-black text-[var(--color-portal-green)] text-center sm:text-left">{product.price} ₽</div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { onAddToCart(product); onClose(); }}
                disabled={product.stock === 0}
                className="w-full sm:w-auto px-10 py-5 bg-[var(--color-portal-green)] text-black font-black rounded-2xl hover:bg-[var(--color-acid-green)] transition-all disabled:opacity-50 uppercase tracking-widest shadow-xl shadow-[var(--color-portal-green)]/20"
              >
                В КОРЗИНУ
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Pages ---

const HomePage = ({ onAddToCart, onViewDetails, favoriteIds, onToggleFavorite }: { 
  onAddToCart: (p: Product) => void, 
  onViewDetails: (p: Product) => void,
  favoriteIds: number[],
  onToggleFavorite: (id: number) => void
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
    fetch('/api/categories').then(res => res.json()).then(setCategories);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-16 py-4 sm:py-10"
    >
      <motion.section 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[50px] sm:rounded-[80px] glass p-10 sm:p-24 flex flex-col items-center text-center gap-10 border-dashed group"
      >
        <div className="absolute top-0 left-0 w-full h-full portal-bg opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-1000" />
        <div className="space-y-8 relative z-10">
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="inline-block px-5 py-2.5 rounded-full border border-[var(--color-portal-green)]/40 text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] text-[var(--color-portal-green)] bg-[var(--color-portal-green)]/5"
          >
            ИЗМЕРЕНИЕ C-137
          </motion.div>
          <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[140px] font-black uppercase tracking-tighter leading-[0.8] italic overflow-hidden">
            {["BARAHOLKA", "SHOP"].map((word, i) => (
              <motion.span 
                key={i}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 + (i * 0.2) }}
                className={cn("block", i === 1 && "text-[var(--color-portal-green)]")}
              >
                {word}
              </motion.span>
            ))}
          </h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="max-w-xl mx-auto text-sm sm:text-base md:text-xl text-white/50 uppercase font-black tracking-[0.1em] leading-relaxed"
          >
            ЛУЧШИЙ ОРИГИНАЛЬНЫЙ СТАФФ <br className="hidden sm:block" /> В ЭТОЙ ЧАСТИ ГАЛАКТИКИ
          </motion.p>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex flex-wrap justify-center gap-6 relative z-10 w-full"
        >
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 80px rgba(68,255,0,0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/catalog')} 
            className="group relative px-10 sm:px-14 py-5 sm:py-6 bg-[var(--color-portal-green)] text-black font-black rounded-3xl transition-all uppercase tracking-widest flex items-center gap-4 text-sm sm:text-lg shadow-[0_0_50px_rgba(68,255,0,0.3)]"
          >
            В КАТАЛОГ <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}><ChevronRight size={24} /></motion.div>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/sale')} 
            className="px-10 py-5 sm:py-6 glass border-white/5 font-black rounded-3xl transition-all uppercase tracking-widest text-sm"
          >
            СКИДКИ %
          </motion.button>
        </motion.div>
      </motion.section>

      {/* Featured Categories with Arrows */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-4 sm:px-0">
          <motion.h2 
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-black uppercase tracking-tighter italic"
          >
            КАТЕГОРИИ
          </motion.h2>
          <Link to="/catalog" className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-[var(--color-portal-green)] transition-all hover:translate-x-1">ВСЕ ПРЕДЛОЖЕНИЯ →</Link>
        </div>
        <HorizontalScroll>
          {categories.map((cat, i) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: i * 0.05 
              }}
              whileHover={{ scale: 1.05, backgroundColor: "var(--color-portal-green)", color: "#000" }}
              whileTap={{ scale: 0.95 }}
              viewport={{ once: true }}
              onClick={() => navigate(`/catalog?cat=${cat.slug}`)}
              className={cn(
                "flex-none px-10 py-5 bg-white/5 rounded-3xl border border-white/5 font-black uppercase tracking-widest text-xs transition-all whitespace-nowrap",
                cat.slug === 'sale' && "text-red-500 border-red-500/30 font-bold"
              )}
            >
              {cat.name}
            </motion.button>
          ))}
        </HorizontalScroll>
      </section>

      {/* Popular Products */}
      <section className="space-y-10">
        <div className="flex items-center justify-between px-4 sm:px-0">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic">ПОПУЛЯРНОЕ</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
          {products.slice(0, 6).map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: (i % 3) * 0.1 }}
              viewport={{ once: true }}
            >
              <ProductCard 
                product={product} 
                onAddToCart={onAddToCart} 
                onViewDetails={onViewDetails}
                isFavorite={favoriteIds.includes(product.id)}
                onToggleFavorite={onToggleFavorite}
              />
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

const CatalogPage = ({ onAddToCart, onViewDetails, favoriteIds, onToggleFavorite }: { 
  onAddToCart: (p: Product) => void, 
  onViewDetails: (p: Product) => void,
  favoriteIds: number[],
  onToggleFavorite: (id: number) => void
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<string>('all');
  const [search, setSearch] = useState('');
  const location = useLocation();

  const FLAVORS = [
    { id: 'all', label: 'ВСЕ ВКУСЫ' },
    { id: 'fruit', label: 'ФРУКТОВЫЕ', keywords: ['фрукт', 'киви', 'банан', 'манго', 'ананас', 'яблок', 'персик', 'апельсин', 'цитрус'] },
    { id: 'berry', label: 'ЯГОДНЫЕ', keywords: ['ягод', 'малин', 'клубник', 'черник', 'вишн', 'ежевик', 'смородин'] },
    { id: 'tobacco', label: 'ТАБАЧНЫЕ', keywords: ['табак'] },
    { id: 'mint', label: 'МЯТНЫЕ', keywords: ['мят', 'мята', 'холод', 'ice', 'cool', 'свеж'] }
  ];

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
    fetch('/api/categories').then(res => res.json()).then(setCategories);
    
    const params = new URLSearchParams(location.search);
    const catSlug = params.get('cat');
    if (catSlug) {
      const cat = categories.find(c => c.slug === catSlug);
      if (cat) setSelectedCat(cat.id);
    }
  }, [location.search, categories.length]);

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCat ? p.category_id === selectedCat : true;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    
    let matchesFlavor = selectedFlavor === 'all';
    if (!matchesFlavor && p.flavor) {
      const flavorKeywords = FLAVORS.find(f => f.id === selectedFlavor)?.keywords || [];
      matchesFlavor = flavorKeywords.some(kw => p.flavor!.toLowerCase().includes(kw));
    }
    
    return matchesCat && matchesSearch && matchesFlavor;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="max-w-7xl mx-auto px-4 py-6 sm:py-10 space-y-12 sm:space-y-16"
    >
      <div className="flex flex-col gap-10">
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter uppercase italic leading-none">КАТАЛОГ</h1>
          <div className="flex items-center gap-4">
            <div className="h-0.5 flex-1 bg-gradient-to-r from-[var(--color-portal-green)] to-transparent opacity-20" />
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 whitespace-nowrap">
              Всего товаров: {filteredProducts.length}
            </div>
          </div>
        </div>
        
        <div className="space-y-10">
          <div className="relative max-w-2xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-portal-green)]" size={24} />
            <input 
              type="text" 
              placeholder="ПОИСК В МУЛЬТИВСЕЛЕННОЙ..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-[30px] py-6 pl-16 pr-8 text-lg font-bold placeholder:text-white/10 focus:outline-none focus:border-[var(--color-portal-green)]/30 focus:bg-white/10 transition-all uppercase tracking-widest"
            />
          </div>
          
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 px-1">Категории</div>
              <HorizontalScroll>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCat(null)}
                  className={cn(
                    "px-10 py-5 rounded-3xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-widest border",
                    !selectedCat 
                      ? "bg-[var(--color-portal-green)] text-black border-[var(--color-portal-green)]" 
                      : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10"
                  )}
                >
                  Все товары
                </motion.button>
                {categories.map((cat, i) => (
                  <motion.button 
                    key={cat.id} 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCat(cat.id)}
                    className={cn(
                      "px-10 py-5 rounded-3xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-widest border",
                      selectedCat === cat.id 
                        ? "bg-[var(--color-portal-green)] text-black border-[var(--color-portal-green)]" 
                        : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {cat.name}
                  </motion.button>
                ))}
              </HorizontalScroll>
            </div>
            
            <div className="space-y-4">
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 px-1">Фильтр вкуса</div>
              <HorizontalScroll>
                {FLAVORS.map((flavor, i) => (
                  <motion.button 
                    key={flavor.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedFlavor(flavor.id)}
                    className={cn(
                      "px-8 py-4 rounded-2xl text-[9px] font-black transition-all whitespace-nowrap uppercase tracking-widest border shadow-sm",
                      selectedFlavor === flavor.id 
                        ? "border-[var(--color-portal-green)] text-[var(--color-portal-green)] bg-[var(--color-portal-green)]/5" 
                        : "border-white/5 text-white/20 hover:text-white"
                    )}
                  >
                    {flavor.label}
                  </motion.button>
                ))}
              </HorizontalScroll>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-12">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((p, i) => (
            <motion.div
              layout
              key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: (i % 8) * 0.05 }}
            >
              <ProductCard 
                product={p} 
                onAddToCart={onAddToCart} 
                onViewDetails={onViewDetails}
                isFavorite={favoriteIds.includes(p.id)}
                onToggleFavorite={onToggleFavorite}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const FavoritesPage = ({ user, onAddToCart, onViewDetails, favoriteIds, onToggleFavorite }: { 
  user: User | null,
  onAddToCart: (p: Product) => void, 
  onViewDetails: (p: Product) => void,
  favoriteIds: number[],
  onToggleFavorite: (id: number) => void
}) => {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetch('/api/favorites')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setFavorites(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [favoriteIds, user]);

  if (!user) {
    return (
      <div className="text-center py-40 glass rounded-[50px] border-dashed space-y-8 p-10 max-w-4xl mx-auto mt-10">
        <div className="text-8xl opacity-20">🔒</div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white/40">НУЖНА АВТОРИЗАЦИЯ</h2>
          <p className="text-white/20 font-black uppercase tracking-[0.2em]">ВОЙДИТЕ В АККАУНТ, ЧТОБЫ УВИДЕТЬ СВОЕ ИЗБРАННОЕ</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/login')}
          className="px-10 py-5 glass border-white/10 font-black rounded-3xl transition-all uppercase tracking-widest text-sm text-[var(--color-portal-green)]"
        >
          ВОЙТИ ЧЕРЕЗ TELEGRAM
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="max-w-7xl mx-auto px-4 py-10 space-y-16"
    >
      <div className="space-y-4">
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter uppercase italic leading-none">ИЗБРАННОЕ</h1>
        <div className="flex items-center gap-4">
          <div className="h-0.5 flex-1 bg-gradient-to-r from-red-500 to-transparent opacity-20" />
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 whitespace-nowrap">
            {favorites.length} ПРЕДМЕТОВ
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-red-500">
            <Heart size={48} />
          </motion.div>
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-40 glass rounded-[50px] border-dashed space-y-8 p-10">
          <div className="text-8xl opacity-20 grayscale">💔</div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white/40">ОДИНОКОЕ МЕСТО...</h2>
            <p className="text-white/20 font-black uppercase tracking-[0.2em]">ВЫ ЕЩЕ НИЧЕГО НЕ ДОБАВИЛИ В ИЗБРАННОЕ</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
            className="px-10 py-5 glass border-white/10 font-black rounded-3xl transition-all uppercase tracking-widest text-sm text-red-500"
          >
            ← ВЕРНУТЬСЯ НАЗАД
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-12">
          <AnimatePresence mode="popLayout">
            {favorites.map((p, i) => (
              <motion.div
                layout
                key={p.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
              >
                <ProductCard 
                  product={p} 
                  onAddToCart={onAddToCart} 
                  onViewDetails={onViewDetails}
                  isFavorite={true}
                  onToggleFavorite={onToggleFavorite}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

const ProfilePage = ({ user, onLogout, tonEnabled }: { user: User | null, onLogout: () => void, tonEnabled: boolean }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = tonConnectUI.wallet;
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetch('/api/orders/my').then(res => res.json()).then(data => setOrders(Array.isArray(data) ? data : []));
    
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      setShowSuccessModal(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, location]);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-6 sm:space-y-10 overflow-hidden relative">
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111] border border-[var(--color-portal-green)]/30 rounded-[40px] p-8 sm:p-12 max-w-lg w-full text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-[var(--color-portal-green)]/20 blur-[60px] rounded-full pointer-events-none" />
              <div className="mx-auto w-20 h-20 bg-[var(--color-portal-green)]/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} className="text-[var(--color-portal-green)]" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-4">Оплата <span className="text-[var(--color-portal-green)] outline-glow">успешна</span></h2>
              <p className="text-white/60 mb-8 font-bold leading-relaxed">
                Ваш заказ успешно оформлен и оплачен. Ожидайте, с вами обязательно свяжется менеджер и уточнит все детали доставки.
              </p>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-4 bg-[var(--color-portal-green)] text-black font-black uppercase tracking-widest rounded-2xl hover:bg-[var(--color-acid-green)] transition-all"
              >
                Понятно, спасибо
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass p-6 sm:p-10 rounded-[30px] sm:rounded-[40px] flex flex-col md:flex-row items-center gap-6 sm:gap-8 border-dashed">
        <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-[30px] sm:rounded-[40px] bg-[var(--color-portal-green)] flex items-center justify-center text-4xl sm:text-5xl font-black text-black rotate-6 shadow-xl shadow-[var(--color-portal-green)]/10">
          {user.first_name[0]}
        </div>
        <div className="text-center md:text-left space-y-2 w-full min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase break-words leading-tight">
            {user.first_name} {user.username && <span className="text-white/40 block sm:inline">@{user.username}</span>}
          </h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4 pt-2">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <Zap size={14} className="text-[var(--color-portal-green)]" /> Статус: Путешественник
            </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <History size={14} className="text-[var(--color-portal-green)]" /> Заказов: {orders.length}
            </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <CreditCard size={14} className="text-[var(--color-portal-green)]" /> {user.balance || 0} ₽
            </div>
          </div>
          {tonEnabled && wallet && (
            <div className="pt-2 text-[10px] font-bold text-[var(--color-portal-green)] uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
              <span className="w-2 h-2 bg-[var(--color-portal-green)] rounded-full animate-pulse" />
              TON Wallet: {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-black tracking-tighter uppercase italic">История заказов</h2>
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="glass p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Заказ #{order.id}</div>
                  <div className="text-sm font-bold">{new Date(order.created_at).toLocaleDateString('ru-RU')}</div>
                  {order.delivery_method && (
                    <div className="text-[9px] text-[var(--color-portal-green)] uppercase font-bold tracking-tighter">
                      {order.delivery_method === 'pickup' ? 'Самовывоз' : 'Доставка'}: {order.delivery_address || 'Пункт выдачи'}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                    order.status === 'completed' ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
                  )}>
                    {order.status === 'completed' ? 'Выполнен' : 'В обработке'}
                  </div>
                </div>
                <div className="text-xl font-black text-[var(--color-portal-green)]">{order.total_price} ₽</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass p-10 rounded-3xl text-center text-white/30 uppercase tracking-widest text-xs font-bold">
            Вы еще ничего не заказывали
          </div>
        )}
      </div>
    </div>
  );
};

const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Define the widget callback in window
    (window as any).onTelegramAuth = (user: any) => {
      fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) onLogin(data.user);
      });
    };

    const script = document.createElement('script');
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute('data-telegram-login', import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'BARAHOLKA_SHOP_BOT');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '16');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      delete (window as any).onTelegramAuth;
    };
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="glass p-6 sm:p-10 rounded-[35px] sm:rounded-[40px] max-w-md w-full text-center space-y-8 sm:space-y-10 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 portal-bg opacity-30" />
        <div className="relative z-10 space-y-6 sm:space-y-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[var(--color-portal-green)] rounded-[24px] sm:rounded-[32px] mx-auto flex items-center justify-center rotate-12 shadow-[0_0_30px_rgba(68,255,0,0.3)]">
            <User size={40} className="text-black sm:size-[48px]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase leading-tight">АВТОРИЗАЦИЯ</h1>
            <p className="text-white/40 text-xs sm:text-sm px-2">Используйте официальный виджет Telegram для безопасного входа в мультивселенную Baraholka.</p>
          </div>
          
          <div className="space-y-6 flex flex-col items-center">
            <div ref={containerRef} className="min-h-[54px] flex items-center justify-center" />
            
            <div className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
              Ожидание авторизации через виджет выше
            </div>
            
            <div className="pt-8 border-t border-white/5 w-full">
              <Link to="/admin/login" className="text-white/30 text-[10px] font-bold uppercase tracking-widest hover:text-[var(--color-portal-green)] transition-colors">
                Вход для администрации &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminLoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const data = await res.json();
      onLogin(data.user);
      navigate('/admin');
    } else {
      setError('Неверные учетные данные или доступ запрещен');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="glass p-6 sm:p-10 rounded-[35px] sm:rounded-[40px] max-w-md w-full text-center space-y-8 sm:space-y-10 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 portal-bg opacity-30" />
        <div className="relative z-10 space-y-6 sm:space-y-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[var(--color-portal-green)] rounded-[24px] sm:rounded-[32px] mx-auto flex items-center justify-center rotate-12 shadow-[0_0_30px_rgba(68,255,0,0.3)]">
            <Settings size={40} className="text-black sm:size-[48px]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase leading-tight">АДМИН ВХОД</h1>
            <p className="text-white/40 text-xs sm:text-sm">Панель управления измерением C-137</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="text" 
              placeholder="Логин" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-[var(--color-glass-border)] rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-[var(--color-portal-green)] transition-colors"
            />
            <input 
              type="password" 
              placeholder="Пароль" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-[var(--color-glass-border)] rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-[var(--color-portal-green)] transition-colors"
            />
            {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{error}</p>}
            <button 
              type="submit"
              className="w-full py-4 bg-[var(--color-portal-green)] text-black font-black rounded-2xl hover:scale-105 transition-transform uppercase tracking-widest shadow-lg shadow-[var(--color-portal-green)]/20"
            >
              ВОЙТИ
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const CartPage = ({ cart, onRemove, onCheckout, tonEnabled }: { cart: Product[], onRemove: (index: number) => void, onCheckout: (delivery: any, paymentMethod: 'traditional' | 'ton') => void, tonEnabled: boolean }) => {
  const [step, setStep] = useState<'cart'|'delivery'|'confirm'>('cart');
  const [deliveryMethod, setDeliveryMethod] = useState<any>(null);
  const [talnakhSubOption, setTalnakhSubOption] = useState<any>(null);
  const [address, setAddress] = useState('');
  
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const deliveryFee = talnakhSubOption ? talnakhSubOption.fee : (deliveryMethod?.fee || 0);
  const total = subtotal + deliveryFee;

  const DELIVERY_METHODS = [
    { id: 'pickup', label: 'Самовывоз (Норильск)', fee: 0, icon: '🏃' },
    { id: 'pickup_cucumber', label: 'Самовывоз доставляет огурец', fee: 1000, icon: '🥒' },
    { id: 'delivery_norilsk', label: 'Доставка: Норильск', fee: 250, icon: '🚛' },
    { id: 'delivery_talnah', label: 'Доставка: Талнах', fee: 50, icon: '🚌', subOptions: [
      { id: 'station', label: 'До автовокзала', fee: 50, icon: '🚌' },
      { id: 'address_mkr', label: 'До адреса (3-4 мкр)', fee: 150, icon: '🏡' }
    ]},
    { id: 'delivery_kayarkan', label: 'Доставка: Кайеркан', fee: 75, icon: '🚛' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
      <div className="space-y-2">
        <h1 className="text-5xl font-black tracking-tighter uppercase">
          {step === 'cart' ? 'КОРЗИНА' : step === 'delivery' ? 'ДОСТАВКА' : 'ПОДТВЕРЖДЕНИЕ'}
        </h1>
        <p className="text-white/30 uppercase tracking-widest text-[10px]">
          {step === 'cart' ? 'Ваш улов из разных измерений' : step === 'delivery' ? 'Выберите способ получения' : 'Завершение оформления'}
        </p>
      </div>
      
      {cart.length === 0 ? (
        <div className="glass p-20 rounded-[40px] text-center space-y-8 border-dashed">
          <div className="text-7xl">🛒</div>
          <div className="space-y-2">
            <div className="text-xl font-bold uppercase tracking-widest">Пусто, как в голове у Джерри</div>
            <p className="text-white/40 text-sm">Пора бы что-нибудь прикупить, пока портал не закрылся.</p>
          </div>
          <Link to="/catalog" className="inline-block px-10 py-4 bg-[var(--color-portal-green)] text-black font-black rounded-2xl hover:scale-105 transition-transform">В КАТАЛОГ</Link>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {step === 'cart' && (
            <motion.div 
              key="step-cart"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="glass rounded-[40px] overflow-hidden divide-y divide-white/5">
                {cart.map((item, idx) => (
                  <div key={idx} className="p-8 flex items-center gap-6 group hover:bg-white/5 transition-colors">
                    <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center text-3xl">
                      {item.category_name === 'Жижи' ? '🧪' : item.category_name === 'Подики' ? '🔋' : '💨'}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest">{item.category_name}</div>
                      <div className="font-bold text-lg">{item.name}</div>
                      <div className="text-[var(--color-portal-green)] font-black">{item.price} ₽</div>
                    </div>
                    <button onClick={() => onRemove(idx)} className="p-3 text-white/20 hover:text-red-500 transition-colors">
                      <Trash2 size={24} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="glass p-10 rounded-[40px] space-y-8 border-dashed">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <div className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Подытог (без доставки)</div>
                    <div className="text-4xl font-black text-[var(--color-portal-green)]">{subtotal} ₽</div>
                  </div>
                </div>
                <button 
                  onClick={() => setStep('delivery')}
                  className="w-full py-6 bg-[var(--color-portal-green)] text-black font-black text-xl rounded-2xl hover:scale-[1.02] transition-transform shadow-[0_0_40px_rgba(68,255,0,0.3)] uppercase tracking-widest"
                >
                  ОФОРМИТЬ ЗАКАЗ
                </button>
                <button 
                  onClick={() => { if(confirm('Очистить корзину?')) { cart.forEach((_,i) => onRemove(0)) } }}
                  className="w-full py-4 text-white/30 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest"
                >
                  Очистить всё
                </button>
              </div>
            </motion.div>
          )}

          {step === 'delivery' && (
            <motion.div 
              key="step-delivery"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {!deliveryMethod ? (
                <div className="glass rounded-[40px] overflow-hidden divide-y divide-white/5">
                  {DELIVERY_METHODS.map((method) => (
                    <button 
                      key={method.id}
                      onClick={() => { 
                        setDeliveryMethod(method); 
                        if (!method.subOptions) {
                          if (method.id.includes('pickup')) setStep('confirm');
                        }
                      }}
                      className="w-full p-8 flex items-center gap-6 hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl">
                        {method.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-lg">{method.label}</div>
                        <div className="text-[var(--color-portal-green)] font-black">+{method.fee} ₽</div>
                      </div>
                      <ChevronRight className="text-white/20" />
                    </button>
                  ))}
                </div>
              ) : deliveryMethod.id === 'delivery_talnah' && !talnakhSubOption ? (
                <div className="space-y-6">
                  <div className="glass rounded-3xl p-6 text-center text-xs font-bold text-white/30 uppercase tracking-widest border-dashed border-white/10">
                    Доставка в Талнах:
                  </div>
                  <div className="glass rounded-[40px] overflow-hidden divide-y divide-white/5">
                    {deliveryMethod.subOptions.map((sub: any) => (
                      <button 
                        key={sub.id}
                        onClick={() => { setTalnakhSubOption(sub); if(sub.id === 'station') setStep('confirm'); }}
                        className="w-full p-8 flex items-center gap-6 hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl">
                          {sub.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-lg">{sub.label}</div>
                          <div className="text-[var(--color-portal-green)] font-black">+{sub.fee} ₽</div>
                        </div>
                        <ChevronRight className="text-white/20" />
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => { setDeliveryMethod(null); setTalnakhSubOption(null); }}
                    className="w-full py-4 glass border-white/5 text-white/30 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    ← Назад
                  </button>
                </div>
              ) : (
                <div className="glass p-10 rounded-[40px] space-y-6">
                  <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                    Введите адрес доставки ({talnakhSubOption?.label || deliveryMethod.label})
                  </div>
                  <input 
                    type="text" 
                    placeholder="Улица, дом, кв..." 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-white/5 border border-[var(--color-glass-border)] rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-[var(--color-portal-green)] transition-colors"
                  />
                  <div className="flex flex-col gap-4">
                    <button 
                      disabled={!address}
                      onClick={() => setStep('confirm')}
                      className="w-full py-6 bg-[var(--color-portal-green)] text-black font-black text-xl rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 uppercase tracking-widest"
                    >
                      ДАЛЕЕ
                    </button>
                    <button 
                      onClick={() => { setDeliveryMethod(null); setTalnakhSubOption(null); }}
                      className="w-full py-4 text-white/30 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest"
                    >
                      К выбору способа
                    </button>
                  </div>
                </div>
              )}

              {!deliveryMethod && (
                <button 
                  onClick={() => setStep('cart')}
                  className="w-full py-4 text-white/30 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  ← Назад в корзину
                </button>
              )}
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div 
              key="step-confirm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="glass p-10 rounded-[40px] space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 portal-bg opacity-10" />
                <div className="flex items-center gap-4 text-red-500 font-bold uppercase tracking-widest text-xs">
                  <Info size={18} /> Подтверждение заказа
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-white/60 leading-relaxed">
                    У вас есть <span className="text-white font-bold">10 минут</span> на оплату заказа, после чего он будет автоматически отменен.
                  </p>
                  <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl space-y-4">
                    <p className="text-sm text-white/80">
                      Для завершения оформления необходимо оплатить гарантию — <span className="font-bold underline">50 ₽</span>.
                    </p>
                    <p className="text-[10px] text-white/40 italic">
                      Это гарантия того, что вы заберете заказ. При успешном получении эти 50 ₽ будут зачислены на ваш баланс и могут быть использованы для следующих заказов.
                    </p>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-white/5 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Товары ({cart.length})</span>
                    <span>{subtotal} ₽</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Доставка ({talnakhSubOption?.label || deliveryMethod?.label})</span>
                    <span>+{deliveryFee} ₽</span>
                  </div>
                  <div className="flex justify-between text-2xl font-black pt-2">
                    <span className="text-white/30 uppercase tracking-widest italic">ИТОГО</span>
                    <span className="text-[var(--color-portal-green)]">{total} ₽</span>
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-6">
                  <button 
                    onClick={() => onCheckout({ 
                      delivery_method: talnakhSubOption ? `${deliveryMethod?.id}_${talnakhSubOption.id}` : deliveryMethod?.id, 
                      delivery_address: talnakhSubOption?.id === 'station' ? 'До автовокзала' : address, 
                      delivery_fee: deliveryFee 
                    }, 'traditional')}
                    className="w-full py-6 bg-[var(--color-portal-green)] text-black font-black text-xl rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 shadow-lg shadow-[var(--color-portal-green)]/20 uppercase tracking-widest"
                  >
                    💳 КАРТОЙ (Гарантия 50 ₽)
                  </button>
                  
                  {tonEnabled && (
                    <div className="flex flex-col gap-2">
                      <p className="text-[9px] text-center text-white/20 uppercase font-black tracking-widest">Web3 Оплата</p>
                      <button 
                        onClick={() => onCheckout({ 
                          delivery_method: talnakhSubOption ? `${deliveryMethod?.id}_${talnakhSubOption.id}` : deliveryMethod?.id, 
                          delivery_address: talnakhSubOption?.id === 'station' ? 'До автовокзала' : address, 
                          delivery_fee: deliveryFee 
                        }, 'ton')}
                        className="w-full py-4 bg-[#229ED9] text-white font-black text-sm rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 shadow-lg shadow-[#229ED9]/20 uppercase tracking-widest"
                      >
                        🧪 ОПЛАТИТЬ ЧЕРЕЗ TON
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => setStep('delivery')}
                    className="w-full py-2 text-white/30 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest"
                  >
                    ❌ ОТМЕНИТЬ ЗАКАЗ
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

const AdminDashboard = ({ user }: { user: User | null }) => {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ yookassa_shop_id: '', yookassa_api_key: '' });
  const [activeTab, setActiveTab] = useState('stats');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [flavorFilter, setFlavorFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    category_id: 1,
    image_url: '',
    nicotine: '',
    volume: '',
    flavor: '',
    is_sale: false,
    is_used: false
  });
  const navigate = useNavigate();

  const getDeliveryLabel = (method: string) => {
    const mapping: Record<string, string> = {
      'pickup': '🏃 Самовывоз',
      'pickup_cucumber': '🥒 Огурец',
      'delivery_norilsk': '🚛 Норильск',
      'delivery_talnah': '🚌 Талнах',
      'delivery_talnah_station': '🚌 Талнах (Автовокзал)',
      'delivery_talnah_address_mkr': '🏡 Талнах (Адрес)',
      'delivery_kayarkan': '🚛 Кайеркан'
    };
    return mapping[method] || method;
  };

  const updateOrderStatus = (id: number, newStatus: string) => {
    fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    }).then(() => {
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    });
  };

  const updateProductStock = (id: number, newStock: number) => {
    if (newStock < 0) return;
    fetch(`/api/admin/products/${id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: newStock })
    }).then(() => {
      setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
    });
  };

  const openEditModal = (product: Product) => {
    setEditingProductId(product.id);
    setNewProduct(product);
    setShowCreateModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setNewProduct(prev => ({ ...prev, image_url: data.url }));
      } else {
        alert('Ошибка при загрузке: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка при загрузке изображения');
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingProductId ? `/api/admin/products/${editingProductId}` : '/api/admin/products';
    const method = editingProductId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    })
    .then(res => res.json())
    .then(data => {
      const category = categories.find(c => c.id === Number(newProduct.category_id));
      const savedProduct: Product = {
        ...newProduct as Product,
        id: editingProductId || data.id,
        category_name: category?.name || ''
      };
      
      if (editingProductId) {
        setProducts(products.map(p => p.id === editingProductId ? savedProduct : p));
        alert('Изменения сохранены!');
      } else {
        setProducts([savedProduct, ...products]);
        alert('Товар успешно добавлен!');
      }
      
      setShowCreateModal(false);
      setEditingProductId(null);
      setNewProduct({
        name: '', description: '', category_id: 1, image_url: '',
        nicotine: '', volume: '', flavor: '', is_sale: false, is_used: false
      });
    });
  };

  const FLAVORS = [
    { id: 'all', label: 'Все вкусы' },
    { id: 'fruit', label: 'Фруктовые', keywords: ['фрукт', 'киви', 'банан', 'манго', 'ананас', 'яблок', 'персик', 'апельсин', 'цитрус'] },
    { id: 'berry', label: 'Ягодные', keywords: ['ягод', 'малин', 'клубник', 'черник', 'вишн', 'ежевик', 'смородин'] },
    { id: 'tobacco', label: 'Табачные', keywords: ['табак'] },
    { id: 'mint', label: 'Мятные', keywords: ['мят', 'мята', 'холод', 'ice', 'cool', 'свеж'] }
  ];

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetch('/api/admin/stats').then(res => res.json()).then(setStats);
    fetch('/api/admin/orders').then(res => res.json()).then(data => setOrders(Array.isArray(data) ? data : []));
    fetch('/api/products').then(res => res.json()).then(data => setProducts(Array.isArray(data) ? data : []));
    fetch('/api/categories').then(res => res.json()).then(data => setCategories(Array.isArray(data) ? data : []));
    fetch('/api/admin/users').then(res => res.json()).then(data => setUsers(Array.isArray(data) ? data : []));
    fetch('/api/admin/settings').then(res => res.json()).then(setSettings);
  }, [user]);

  const saveSettings = () => {
    fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings })
    }).then(res => {
      if (res.ok) alert('Настройки сохранены!');
    });
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10 space-y-8 sm:space-y-10 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase leading-tight shrink-0 italic">
          АДМИН <span className="text-[var(--color-portal-green)] outline-glow">ПАНЕЛЬ</span>
        </h1>
        <div className="flex bg-white/5 p-1.5 rounded-[22px] border border-white/10 overflow-x-auto scrollbar-hide">
          {[
            { id: 'stats', label: 'Данные', icon: <TrendingUp size={14}/> },
            { id: 'orders', label: 'Заказы', icon: <Package size={14}/> },
            { id: 'products', label: 'Склад', icon: <Settings size={14}/> },
            { id: 'users', label: 'Клиенты', icon: <User size={14}/> },
            { id: 'settings', label: 'Настройки', icon: <Settings size={14}/> }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative px-6 py-3 rounded-2xl text-[10px] font-black transition-all flex items-center gap-2 uppercase tracking-[0.2em] text-nowrap group shrink-0"
            >
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="active-admin-tab"
                  className="absolute inset-0 bg-[var(--color-portal-green)] rounded-2xl z-0 shadow-[0_0_20px_rgba(68,255,0,0.3)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className={cn(
                "relative z-10 flex items-center gap-2",
                activeTab === tab.id ? "text-black" : "text-white/30 group-hover:text-white group-hover:bg-white/5"
              )}>
                {tab.icon} {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { label: 'Выручка', val: `${stats.totalSales} ₽`, color: "text-[var(--color-portal-green)]" },
                { label: 'Всего заказов', val: stats.orderCount },
                { label: 'Пользователей', val: stats.userCount }
              ].map((s, i) => (
                <motion.div 
                  key={s.label}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass p-10 rounded-[40px] space-y-4 border-dashed"
                >
                  <div className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{s.label}</div>
                  <div className={cn("text-5xl font-black leading-none", s.color)}>{s.val}</div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="glass rounded-[40px] overflow-hidden border-dashed">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-white/30 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-6">ID</th>
                      <th className="px-8 py-6">Клиент</th>
                      <th className="px-8 py-6">Доставка</th>
                      <th className="px-8 py-6">Сумма</th>
                      <th className="px-8 py-6">Статус</th>
                      <th className="px-8 py-6">Дата</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.map((order, i) => (
                      <motion.tr 
                        key={order.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-8 py-6 font-mono text-xs opacity-50">#{order.id}</td>
                        <td className="px-8 py-6 font-bold">{order.username ? `@${order.username}` : order.first_name}</td>
                        <td className="px-8 py-6">
                          <div className="text-[10px] font-bold uppercase">{getDeliveryLabel(order.delivery_method || 'N/A')}</div>
                          <div className="text-[9px] text-white/30 truncate max-w-[150px]">{order.delivery_address || '-'}</div>
                        </td>
                        <td className="px-8 py-6 text-[var(--color-portal-green)] font-black">{order.total_price} ₽</td>
                        <td className="px-8 py-6">
                          <button 
                            onClick={() => updateOrderStatus(order.id, order.status === 'completed' ? 'pending' : 'completed')}
                            className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95",
                              order.status === 'completed' ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
                            )}
                          >
                            {order.status === 'completed' ? 'Выполнен' : 'В работе'}
                          </button>
                        </td>
                        <td className="px-8 py-6 text-white/30 text-xs">{new Date(order.created_at).toLocaleDateString('ru-RU')}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                    {[
                      { id: 'all', label: 'Все' },
                      { id: 'in_stock', label: 'В наличии' },
                      { id: 'out_of_stock', label: 'Нет в наличии' }
                    ].map(filter => (
                      <button 
                        key={filter.id}
                        onClick={() => setStockFilter(filter.id as any)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest text-nowrap",
                          stockFilter === filter.id ? "bg-white/10 text-white" : "text-white/30 hover:text-white"
                        )}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto scrollbar-hide max-w-full sm:max-w-xs">
                    {FLAVORS.map(flavor => (
                      <button 
                        key={flavor.id}
                        onClick={() => setFlavorFilter(flavor.id)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest text-nowrap",
                          flavorFilter === flavor.id ? "bg-[var(--color-portal-green)]/20 text-[var(--color-portal-green)]" : "text-white/30 hover:text-white"
                        )}
                      >
                        {flavor.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setEditingProductId(null);
                    setNewProduct({
                      name: '', description: '', category_id: 1, image_url: '',
                      nicotine: '', volume: '', flavor: '', is_sale: false, is_used: false
                    });
                    setShowCreateModal(true);
                  }}
                  className="flex items-center gap-2 bg-[var(--color-portal-green)] text-black px-8 py-5 rounded-2xl font-black hover:bg-[var(--color-acid-green)] transition-all uppercase tracking-widest text-xs w-full lg:w-auto shadow-xl shadow-[var(--color-portal-green)]/20"
                >
                  <Plus size={22} /> Добавить товар
                </motion.button>
              </div>
              
              <AnimatePresence>
                {showCreateModal && (
                  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 40 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 40 }}
                      className="glass w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 space-y-6 relative border-white/10"
                    >
                      <button 
                        onClick={() => setShowCreateModal(false)}
                        className="absolute top-6 right-6 p-3 hover:bg-white/5 rounded-full transition-all text-white/30 hover:text-white"
                      >
                        <X size={24} />
                      </button>

                      <div className="space-y-1">
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic">
                          {editingProductId ? 'РЕДАКТОР' : 'НОВЫЙ'} <span className="text-[var(--color-portal-green)]">ТОВАР</span>
                        </h2>
                        <div className="h-1 w-12 bg-[var(--color-portal-green)] rounded-full" />
                      </div>

                      <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/20 px-1">Название</label>
                          <input 
                            required
                            type="text" 
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-md font-bold focus:outline-none focus:border-[var(--color-portal-green)] transition-all placeholder:text-white/10 text-white"
                            placeholder="Название товара..."
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/20 px-1">Описание</label>
                          <textarea 
                            value={newProduct.description}
                            onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[var(--color-portal-green)] transition-all placeholder:text-white/10 text-white/80 min-h-[100px] resize-none"
                            placeholder="Описание характеристик..."
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/20 px-1">Категория</label>
                          <div className="relative">
                            <select 
                              value={newProduct.category_id}
                              onChange={(e) => setNewProduct({...newProduct, category_id: Number(e.target.value)})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-[var(--color-portal-green)] transition-all appearance-none cursor-pointer"
                            >
                              {categories.map(c => (
                                <option key={c.id} value={c.id} className="bg-[#0f0f0f] text-white">{c.name}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20" size={14} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/20 px-1">Цена</label>
                            <input 
                              required
                              type="number" 
                              value={newProduct.price === undefined ? "" : newProduct.price}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewProduct({...newProduct, price: val === "" ? undefined : Number(val)});
                              }}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-black focus:outline-none focus:border-[var(--color-portal-green)] transition-all"
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/20 px-1">Склад</label>
                            <input 
                              required
                              type="number" 
                              value={newProduct.stock === undefined ? "" : newProduct.stock}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewProduct({...newProduct, stock: val === "" ? undefined : Number(val)});
                              }}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-black focus:outline-none focus:border-[var(--color-portal-green)] transition-all"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/20 px-1">Вкус</label>
                          <input 
                            type="text" 
                            value={newProduct.flavor}
                            onChange={(e) => setNewProduct({...newProduct, flavor: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-[var(--color-portal-green)] transition-all"
                            placeholder="Мята..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/20 px-1">Никотин</label>
                            <input 
                              type="text" 
                              value={newProduct.nicotine}
                              onChange={(e) => setNewProduct({...newProduct, nicotine: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-[var(--color-portal-green)] transition-all"
                              placeholder="20mg"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/20 px-1">Объем</label>
                            <input 
                              type="text" 
                              value={newProduct.volume}
                              onChange={(e) => setNewProduct({...newProduct, volume: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-[var(--color-portal-green)] transition-all"
                              placeholder="30ml"
                            />
                          </div>
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/20 px-1">Картинка</label>
                          <div className="flex gap-3">
                            <label className="flex-1 bg-white/5 border border-white/10 hover:border-[var(--color-portal-green)] transition-all rounded-xl py-3 px-4 flex items-center justify-center gap-3 cursor-pointer group">
                              <Upload size={16} className="text-[var(--color-portal-green)] group-hover:-translate-y-1 transition-transform" />
                              <span className="text-xs font-bold text-white/50 group-hover:text-white transition-colors">Загрузить файл</span>
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </label>
                            <div className="w-12 h-12 rounded-xl border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center shrink-0">
                              {newProduct.image_url ? (
                                <img src={newProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <Droplets size={16} className="text-white/10" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-2 flex gap-6 pt-2 px-1">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div 
                              onClick={() => setNewProduct({...newProduct, is_sale: !newProduct.is_sale})}
                              className={cn(
                                "w-5 h-5 rounded-md border transition-all flex items-center justify-center",
                                newProduct.is_sale ? "bg-red-500 border-red-500" : "border-white/10"
                              )}
                            >
                              {newProduct.is_sale && <Check size={14} className="text-white" />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">SALE</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div 
                              onClick={() => setNewProduct({...newProduct, is_used: !newProduct.is_used})}
                              className={cn(
                                "w-5 h-5 rounded-md border transition-all flex items-center justify-center",
                                newProduct.is_used ? "bg-yellow-500 border-yellow-500" : "border-white/10"
                              )}
                            >
                              {newProduct.is_used && <Check size={14} className="text-white" />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Б/У</span>
                          </label>
                        </div>

                        <div className="md:col-span-2 pt-4">
                          <button 
                            type="submit"
                            className="w-full py-4 bg-[var(--color-portal-green)] text-black font-black text-lg rounded-2xl hover:bg-[var(--color-acid-green)] transition-all uppercase tracking-widest"
                          >
                            {editingProductId ? 'СОХРАНИТЬ ИЗМЕНЕНИЯ' : 'ДОБАВИТЬ ТОВАР'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {products
                    .filter(p => {
                      const matchesStock = stockFilter === 'in_stock' ? p.stock > 0 : stockFilter === 'out_of_stock' ? p.stock === 0 : true;
                      let matchesFlavor = flavorFilter === 'all';
                      if (!matchesFlavor && p.flavor) {
                        const flavorKeywords = FLAVORS.find(f => f.id === flavorFilter)?.keywords || [];
                        matchesFlavor = flavorKeywords.some(kw => p.flavor!.toLowerCase().includes(kw));
                      }
                      return matchesStock && matchesFlavor;
                    })
                    .map((p, i) => (
                    <motion.div 
                      layout
                      key={p.id} 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="glass p-6 rounded-3xl flex items-center gap-6 group hover:border-[var(--color-portal-green)] transition-all hover:bg-white/5"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-black/50 flex items-center justify-center text-3xl group-hover:rotate-12 transition-transform">
                        {p.category_name === 'Жижи' ? '🧪' : p.category_name === 'Подики' ? '🔋' : '💨'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn(
                            "w-2 h-2 rounded-full shadow-[0_0_8px]",
                            p.stock > 0 ? "bg-[var(--color-portal-green)] shadow-[var(--color-portal-green)]" : "bg-red-500 shadow-red-500"
                          )} />
                          <div className="font-bold truncate text-lg leading-none uppercase italic italic-small">{p.name}</div>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{p.price} ₽</div>
                          <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-1.5 gap-1 group/stock">
                            <button 
                              onClick={() => updateProductStock(p.id, p.stock - 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-white/20 hover:text-red-500"
                            >
                              <Minus size={14} />
                            </button>
                            <StockInput 
                              initialStock={p.stock}
                              onUpdate={(val) => updateProductStock(p.id, val)}
                            />
                            <button 
                              onClick={() => updateProductStock(p.id, p.stock + 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-white/20 hover:text-[var(--color-portal-green)]"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => openEditModal(p)}
                          className="p-3 text-white/20 hover:text-[var(--color-portal-green)] transition-colors"
                        >
                          <Edit3 size={20} />
                        </button>
                        <button className="p-3 text-white/20 hover:text-red-500 transition-colors">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-10">
              {selectedUser ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="flex items-center gap-2 text-[var(--color-portal-green)] font-black uppercase tracking-[0.2em] text-[10px] hover:translate-x-[-4px] transition-transform"
                  >
                    &larr; Назад к списку
                  </button>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 glass p-10 rounded-[40px] flex flex-col items-center text-center space-y-8">
                      <motion.div 
                        animate={{ rotate: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 5 }}
                        className="w-24 h-24 rounded-3xl bg-[var(--color-portal-green)] text-black flex items-center justify-center text-5xl font-black shadow-2xl shadow-[var(--color-portal-green)]/30"
                      >
                        {selectedUser.first_name?.[0] || 'U'}
                      </motion.div>
                      <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic">{selectedUser.first_name} {selectedUser.last_name || ''}</h2>
                        <p className="text-[var(--color-portal-green)] font-black uppercase tracking-widest text-[10px]">@{selectedUser.username || 'unknown'}</p>
                      </div>
                      <div className="w-full pt-8 border-t border-white/5 grid grid-cols-2 gap-8">
                        <div className="text-left space-y-1">
                          <div className="text-[8px] text-white/20 uppercase font-black">Потрачено</div>
                          <div className="text-2xl font-black">{selectedUser.total_spent || 0} ₽</div>
                        </div>
                        <div className="text-left space-y-1">
                          <div className="text-[8px] text-white/20 uppercase font-black">Баланс</div>
                          <div className="text-2xl font-black text-[var(--color-portal-green)]">{selectedUser.balance} ₽</div>
                        </div>
                        <div className="text-left space-y-1">
                          <div className="text-[8px] text-white/20 uppercase font-black">Заказов</div>
                          <div className="text-2xl font-black">{selectedUser.total_orders}</div>
                        </div>
                        <div className="text-left space-y-1">
                          <div className="text-[8px] text-white/20 uppercase font-black">Роль</div>
                          <div className="text-[10px] font-black uppercase text-[var(--color-portal-green)]">{selectedUser.role}</div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 glass rounded-[40px] border-dashed flex flex-col overflow-hidden">
                      <div className="p-8 border-b border-white/5 bg-white/5">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">История заказов</h3>
                      </div>
                      <div className="flex-1 overflow-auto max-h-[600px] scrollbar-hide">
                        <table className="w-full text-left">
                          <thead className="bg-white/5 text-white/30 text-[8px] font-bold uppercase tracking-widest sticky top-0 z-10">
                            <tr>
                              <th className="px-8 py-5">ID</th>
                              <th className="px-8 py-5">Доставка</th>
                              <th className="px-8 py-5">Сумма</th>
                              <th className="px-8 py-5">Статус</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {orders.filter(o => o.user_id === selectedUser.id).map(order => (
                              <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-8 py-5 font-mono text-xs opacity-50">#{order.id}</td>
                                <td className="px-8 py-5">
                                  <div className="text-[10px] font-black uppercase">{getDeliveryLabel(order.delivery_method)}</div>
                                  <div className="text-[8px] text-white/30 truncate max-w-[200px]">{order.delivery_address}</div>
                                </td>
                                <td className="px-8 py-5 text-[var(--color-portal-green)] font-black text-lg">{order.total_price} ₽</td>
                                <td className="px-8 py-5">
                                  <span className={cn(
                                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em]",
                                    order.status === 'completed' ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
                                  )}>
                                    {order.status === 'completed' ? 'Да' : 'В процессе'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="glass rounded-[40px] overflow-hidden border-dashed">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 text-white/30 text-[10px] font-bold uppercase tracking-widest">
                        <tr>
                          <th className="px-8 py-6">Клиент</th>
                          <th className="px-8 py-6">Заказов</th>
                          <th className="px-8 py-6">Доставок</th>
                          <th className="px-8 py-6">Сумма</th>
                          <th className="px-8 py-6">Баланс</th>
                          <th className="px-8 py-6">Действие</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {Array.isArray(users) && users.map(u => (
                          <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-8 py-6 text-sm font-bold uppercase">{u.first_name} <span className="text-[10px] opacity-30 lowercase italic ml-2">@{u.username}</span></td>
                            <td className="px-8 py-6 font-mono font-bold">{u.total_orders || 0}</td>
                            <td className="px-8 py-6 font-mono text-green-500 font-bold">{orders.filter(o => o.user_id === u.id && o.status === 'completed').length}</td>
                            <td className="px-8 py-6 text-[var(--color-portal-green)] font-black">{u.total_spent || 0} ₽</td>
                            <td className="px-8 py-6 font-black">{u.balance} ₽</td>
                            <td className="px-8 py-6">
                              <button 
                                onClick={() => setSelectedUser(u)}
                                className="px-6 py-3 bg-white/5 hover:bg-[var(--color-portal-green)] hover:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                Детали
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="glass p-10 rounded-[40px] max-w-2xl border-dashed space-y-12 mb-20 md:mb-0">
              <div className="space-y-4">
                <h2 className="text-3xl font-black uppercase tracking-tighter">НАСТРОЙКИ</h2>
                <p className="text-white/30 text-[10px] uppercase tracking-[0.3em] font-bold">Управление конфигурацией системы</p>
              </div>
              
              <div className="space-y-12">
                <div className="space-y-8">
                  <h3 className="text-lg font-black uppercase tracking-widest text-[#9c27b0] flex items-center gap-3">
                    <Globe size={22} /> SYSTEM CORE
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">App URL (Base Domain)</label>
                      <input 
                        type="text" 
                        value={settings.app_url || ''}
                        onChange={(e) => setSettings({ ...settings, app_url: e.target.value })}
                        placeholder="https://myshop.ru"
                        className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-8 text-lg font-bold focus:outline-none focus:border-[#9c27b0] transition-all placeholder:text-white/5"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">JWT Secret Key (Осторожно)</label>
                      <input 
                        type="password" 
                        value={settings.jwt_secret || ''}
                        onChange={(e) => setSettings({ ...settings, jwt_secret: e.target.value })}
                        placeholder="super-secret-key-for-sessions"
                        className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-8 text-lg font-bold focus:outline-none focus:border-[#9c27b0] transition-all placeholder:text-white/5"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-8 border-t border-white/5 pt-12">
                  <h3 className="text-lg font-black uppercase tracking-widest text-[#2AABEE] flex items-center gap-3">
                    <Send size={22} /> TELEGRAM BOT
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">Bot Token</label>
                      <input 
                        type="password" 
                        value={settings.telegram_bot_token || ''}
                        onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                        placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                        className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-8 text-lg font-bold focus:outline-none focus:border-[#2AABEE] transition-all placeholder:text-white/5"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">Bot Username (VITE_TELEGRAM_BOT_USERNAME)</label>
                      <input 
                        type="text" 
                        value={settings.telegram_bot_username || ''}
                        onChange={(e) => setSettings({ ...settings, telegram_bot_username: e.target.value })}
                        placeholder="my_shop_bot"
                        className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-8 text-lg font-bold focus:outline-none focus:border-[#2AABEE] transition-all placeholder:text-white/5"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-8 border-t border-white/5 pt-12">
                  <h3 className="text-lg font-black uppercase tracking-widest text-[#2AABEE] flex items-center gap-3">
                    <ShieldAlert size={22} /> TELEGRAM OAUTH 2.0 (OPENID)
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">OAuth ID</label>
                        <input 
                          type="text" 
                          value={settings.telegram_oauth_id || ''}
                          onChange={(e) => setSettings({ ...settings, telegram_oauth_id: e.target.value })}
                          placeholder="7658719788"
                          className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-8 text-lg font-bold focus:outline-none focus:border-[#2AABEE] transition-all placeholder:text-white/5"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">OAuth Secret</label>
                        <input 
                          type="password" 
                          value={settings.telegram_oauth_secret || ''}
                          onChange={(e) => setSettings({ ...settings, telegram_oauth_secret: e.target.value })}
                          placeholder="CGOzBQ84Y6MNEJInp1oCk6..."
                          className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-8 text-lg font-bold focus:outline-none focus:border-[#2AABEE] transition-all placeholder:text-white/5"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">Auth URL</label>
                      <input 
                        type="text" 
                        value={settings.telegram_oauth_auth_url || ''}
                        onChange={(e) => setSettings({ ...settings, telegram_oauth_auth_url: e.target.value })}
                        placeholder="https://oauth.telegram.org/auth"
                        className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-8 text-lg font-bold focus:outline-none focus:border-[#2AABEE] transition-all placeholder:text-white/5"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">Token URL</label>
                      <input 
                        type="text" 
                        value={settings.telegram_oauth_token_url || ''}
                        onChange={(e) => setSettings({ ...settings, telegram_oauth_token_url: e.target.value })}
                        placeholder="https://oauth.telegram.org/token"
                        className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-8 text-lg font-bold focus:outline-none focus:border-[#2AABEE] transition-all placeholder:text-white/5"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-8 border-t border-white/5 pt-12">
                  <h3 className="text-lg font-black uppercase tracking-widest text-[var(--color-portal-green)] flex items-center gap-3">
                    <CreditCard size={22} /> ЮKASSA
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">Shop ID</label>
                      <input 
                        type="text" 
                        value={settings.yookassa_shop_id || ''}
                        onChange={(e) => setSettings({ ...settings, yookassa_shop_id: e.target.value })}
                        placeholder="123456"
                        className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-8 text-lg font-bold focus:outline-none focus:border-[var(--color-portal-green)] transition-all placeholder:text-white/5"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">Secret Key</label>
                      <input 
                        type="password" 
                        value={settings.yookassa_api_key || ''}
                        onChange={(e) => setSettings({ ...settings, yookassa_api_key: e.target.value })}
                        placeholder="live_..."
                        className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-8 text-lg font-bold focus:outline-none focus:border-[var(--color-portal-green)] transition-all placeholder:text-white/5"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-8 border-t border-white/5 pt-12">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black uppercase tracking-widest text-[var(--color-portal-green)] flex items-center gap-3">
                      <Zap size={22} /> TON PAYMENT
                    </h3>
                    <button 
                      onClick={() => setSettings({ ...settings, ton_payment_enabled: settings.ton_payment_enabled === '1' ? '0' : '1' })}
                      className={cn(
                        "relative w-16 h-8 rounded-full transition-colors duration-500 shadow-inner",
                        settings.ton_payment_enabled === '1' ? "bg-[var(--color-portal-green)]" : "bg-white/10"
                      )}
                    >
                      <motion.div 
                        animate={{ x: settings.ton_payment_enabled === '1' ? 32 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-2xl"
                      />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">TON Wallet Address</label>
                    <input 
                      type="text" 
                      value={settings.ton_wallet_address || ''}
                      onChange={(e) => setSettings({ ...settings, ton_wallet_address: e.target.value })}
                      placeholder="UQ..."
                      className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-8 text-lg font-bold focus:outline-none focus:border-[var(--color-portal-green)] transition-all placeholder:text-white/5"
                    />
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={saveSettings}
                  className="w-full bg-[var(--color-portal-green)] text-black font-black uppercase tracking-widest py-6 rounded-3xl shadow-2xl shadow-[var(--color-portal-green)]/30 text-lg hover:bg-[var(--color-acid-green)] transition-all"
                >
                  СОХРАНИТЬ ВСЁ
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>({});
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Fetch settings (publicly accessible)
    fetch('/api/settings')
      .then(res => res.ok ? res.json() : {})
      .then((data: any) => {
        setAppSettings({
          ...data,
          ton_payment_enabled: data.ton_payment_enabled === '1'
        });
      });

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetch('/api/me')
          .then(res => res.ok ? res.json() : null)
          .then(data => data && setUser(data.user));
      }
    };
    window.addEventListener('message', handleMessage);

    // Check for standard session
    fetch('/api/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setUser(data.user);
        } else if (window.Telegram?.WebApp?.initData) {
          // If no session but in TWA, try auto-login
          const tg = window.Telegram.WebApp;
          tg.ready();
          tg.expand();
          
          fetch('/api/auth/webapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg.initData })
          })
          .then(res => res.ok ? res.json() : null)
          .then(data => data && setUser(data.user))
          .catch(err => console.error('TWA Auth failed:', err));
        }
      });

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (user) {
      fetch('/api/favorites')
        .then(res => res.ok ? res.json() : [])
        .then(data => setFavoriteIds(data.map((p: any) => p.id)));
    } else {
      setFavoriteIds([]);
    }
  }, [user]);

  const toggleFavorite = async (productId: number) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      if (res.ok) {
        const { favorited } = await res.json();
        if (favorited) {
          setFavoriteIds(prev => [...prev, productId]);
        } else {
          setFavoriteIds(prev => prev.filter(id => id !== productId));
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleCheckout = (delivery: any, paymentMethod: 'traditional' | 'ton' = 'traditional') => {
    if (!user) {
      navigate('/login');
      return;
    }

    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0) + (delivery.delivery_fee || 0);

    const orderData = {
      items: cart,
      total_price: totalPrice,
      payment_method: paymentMethod,
      ...delivery
    };

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    }).then(async (res) => {
      const data = await res.json();
      setCart([]);
      
      if (data.error) {
        alert(data.error);
      }

      if (data.confirmation_url) {
        window.location.href = data.confirmation_url;
        return;
      }

      if (data.redirect) {
        navigate(data.redirect);
        return;
      }

      if (paymentMethod === 'ton') {
        alert('Заказ оформлен через TON! Транзакция обрабатывается.');
      }
      navigate('/profile');
    });
  };

  return (
    <TonConnectUIProvider manifestUrl={`https://${window.location.host}/tonconnect-manifest.json`}>
      <div className="min-h-screen flex flex-col relative overflow-x-hidden selection:bg-[var(--color-portal-green)] selection:text-black scroll-smooth">
        <ScrollIndicator />
        <div className="portal-bg fixed inset-0 pointer-events-none opacity-5" />
        <Navbar 
          user={user} 
          cartCount={cart.length} 
          favoritesCount={favoriteIds.length} 
          tonEnabled={!!appSettings.ton_payment_enabled} 
        />
        
        <main className="relative z-10 flex-grow w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-4 sm:py-8 md:py-12">
          <AnimatePresence>
            {selectedProduct && (
              <ProductModal 
                product={selectedProduct} 
                onClose={() => setSelectedProduct(null)} 
                onAddToCart={addToCart} 
                isFavorite={favoriteIds.includes(selectedProduct.id)}
                onToggleFavorite={toggleFavorite}
              />
            )}
          </AnimatePresence>
  
          <AnimatePresence mode="wait">
            <motion.div 
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Routes location={location}>
                <Route path="/" element={<HomePage onAddToCart={addToCart} onViewDetails={setSelectedProduct} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />} />
                <Route path="/login" element={<LoginPage onLogin={setUser} />} />
                <Route path="/admin/login" element={<AdminLoginPage onLogin={setUser} />} />
                <Route path="/admin" element={<AdminDashboard user={user} />} />
                <Route path="/catalog" element={<CatalogPage onAddToCart={addToCart} onViewDetails={setSelectedProduct} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />} />
                <Route path="/favorites" element={<FavoritesPage user={user} onAddToCart={addToCart} onViewDetails={setSelectedProduct} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />} />
                <Route path="/cart" element={<CartPage cart={cart} onRemove={removeFromCart} onCheckout={handleCheckout} tonEnabled={!!appSettings.ton_payment_enabled} />} />
                <Route path="/profile" element={<ProfilePage user={user} onLogout={() => setUser(null)} tonEnabled={!!appSettings.ton_payment_enabled} />} />
                <Route path="/sale" element={<CatalogPage onAddToCart={addToCart} onViewDetails={setSelectedProduct} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
  
        <ScrollToTop />
        <footer className="bg-black border-t border-[var(--color-glass-border)] flex flex-col sm:flex-row items-center justify-between px-6 sm:px-10 py-6 sm:h-16 text-[9px] sm:text-[10px] text-white/30 relative z-20 gap-4">
          <div className="flex items-center gap-4">
          </div>
          <div className="text-center sm:text-right">
            © 2026 BARAHOLKA SHOP • ИЗМЕРЕНИЕ C-137
          </div>
        </footer>
      </div>
    </TonConnectUIProvider>
  );
}
