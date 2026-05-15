import React, { useState, useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

// Import icon sets from react-icons
import * as FaIcons from 'react-icons/fa';
import * as Fa6Icons from 'react-icons/fa6';
import * as MdIcons from 'react-icons/md';
import * as HiIcons from 'react-icons/hi';
import * as Hi2Icons from 'react-icons/hi2';
import * as BiIcons from 'react-icons/bi';
import * as BsIcons from 'react-icons/bs';
import * as AiIcons from 'react-icons/ai';
import * as FiIcons from 'react-icons/fi';
import * as IoIcons from 'react-icons/io5';
import * as RiIcons from 'react-icons/ri';
import * as TbIcons from 'react-icons/tb';
import * as GiIcons from 'react-icons/gi';

// Curated icon categories with hand-picked icons
const ICON_CATEGORIES = {
  popular: {
    name: '⭐ Popular',
    icons: [
      { id: 'FaStar', icon: FaIcons.FaStar, name: 'Star' },
      { id: 'FaHeart', icon: FaIcons.FaHeart, name: 'Heart' },
      { id: 'FaFire', icon: FaIcons.FaFire, name: 'Fire' },
      { id: 'FaBolt', icon: FaIcons.FaBolt, name: 'Bolt' },
      { id: 'FaRocket', icon: FaIcons.FaRocket, name: 'Rocket' },
      { id: 'FaGift', icon: FaIcons.FaGift, name: 'Gift' },
      { id: 'FaCrown', icon: FaIcons.FaCrown, name: 'Crown' },
      { id: 'FaGem', icon: FaIcons.FaGem, name: 'Gem' },
      { id: 'FaTrophy', icon: FaIcons.FaTrophy, name: 'Trophy' },
      { id: 'FaMedal', icon: FaIcons.FaMedal, name: 'Medal' },
      { id: 'FaThumbsUp', icon: FaIcons.FaThumbsUp, name: 'Thumbs Up' },
      { id: 'FaCheck', icon: FaIcons.FaCheck, name: 'Check' },
      { id: 'HiSparkles', icon: HiIcons.HiSparkles, name: 'Sparkles' },
      { id: 'FaBell', icon: FaIcons.FaBell, name: 'Bell' },
      { id: 'FaTag', icon: FaIcons.FaTag, name: 'Tag' },
      { id: 'FaPercent', icon: FaIcons.FaPercent, name: 'Percent' },
    ]
  },
  announcements: {
    name: '📢 Announcements',
    icons: [
      { id: 'FaBullhorn', icon: FaIcons.FaBullhorn, name: 'Bullhorn' },
      { id: 'FaMegaport', icon: HiIcons.HiSpeakerphone, name: 'Megaphone' },
      { id: 'FaNewspaper', icon: FaIcons.FaNewspaper, name: 'Newspaper' },
      { id: 'FaEnvelopeOpenText', icon: FaIcons.FaEnvelopeOpenText, name: 'Newsletter' },
      { id: 'FaExclamationCircle', icon: FaIcons.FaExclamationCircle, name: 'Alert' },
      { id: 'FaInfoCircle', icon: FaIcons.FaInfoCircle, name: 'Info' },
      { id: 'FaLightbulb', icon: FaIcons.FaLightbulb, name: 'Idea' },
      { id: 'FaFlag', icon: FaIcons.FaFlag, name: 'Flag' },
      { id: 'FaBookmark', icon: FaIcons.FaBookmark, name: 'Bookmark' },
      { id: 'FaPaperPlane', icon: FaIcons.FaPaperPlane, name: 'Send' },
      { id: 'FaVolumeUp', icon: FaIcons.FaVolumeUp, name: 'Volume' },
      { id: 'FaCommentDots', icon: FaIcons.FaCommentDots, name: 'Comment' },
    ]
  },
  celebration: {
    name: '🎉 Celebration',
    icons: [
      { id: 'GiPartyPopper', icon: GiIcons.GiPartyPopper, name: 'Party' },
      { id: 'FaBirthdayCake', icon: FaIcons.FaBirthdayCake, name: 'Cake' },
      { id: 'GiCakeSlice', icon: GiIcons.GiCakeSlice, name: 'Cake Slice' },
      { id: 'GiCupcake', icon: GiIcons.GiCupcake, name: 'Cupcake' },
      { id: 'FaAward', icon: FaIcons.FaAward, name: 'Award' },
      { id: 'FaCertificate', icon: FaIcons.FaCertificate, name: 'Certificate' },
      { id: 'FaMusic', icon: FaIcons.FaMusic, name: 'Music' },
      { id: 'FaGlassCheers', icon: FaIcons.FaGlassCheers, name: 'Cheers' },
      { id: 'FaWineGlass', icon: FaIcons.FaWineGlass, name: 'Wine' },
      { id: 'FaMedal', icon: FaIcons.FaMedal, name: 'Medal' },
      { id: 'FaHeart', icon: FaIcons.FaHeart, name: 'Heart' },
      { id: 'HiSparkles', icon: HiIcons.HiSparkles, name: 'Sparkles' },
    ]
  },
  shopping: {
    name: '🛍️ Shopping & Sales',
    icons: [
      { id: 'FaShoppingCart', icon: FaIcons.FaShoppingCart, name: 'Cart' },
      { id: 'FaShoppingBag', icon: FaIcons.FaShoppingBag, name: 'Bag' },
      { id: 'FaStore', icon: FaIcons.FaStore, name: 'Store' },
      { id: 'FaTags', icon: FaIcons.FaTags, name: 'Tags' },
      { id: 'FaMoneyBillWave', icon: FaIcons.FaMoneyBillWave, name: 'Money' },
      { id: 'FaCreditCard', icon: FaIcons.FaCreditCard, name: 'Card' },
      { id: 'FaReceipt', icon: FaIcons.FaReceipt, name: 'Receipt' },
      { id: 'FaBox', icon: FaIcons.FaBox, name: 'Box' },
      { id: 'FaTruck', icon: FaIcons.FaTruck, name: 'Delivery' },
      { id: 'FaHandHoldingUsd', icon: FaIcons.FaHandHoldingUsd, name: 'Savings' },
      { id: 'FaPiggyBank', icon: FaIcons.FaPiggyBank, name: 'Piggy Bank' },
      { id: 'FaCoins', icon: FaIcons.FaCoins, name: 'Coins' },
    ]
  },
  time: {
    name: '⏰ Time & Events',
    icons: [
      { id: 'FaClock', icon: FaIcons.FaClock, name: 'Clock' },
      { id: 'FaCalendarAlt', icon: FaIcons.FaCalendarAlt, name: 'Calendar' },
      { id: 'FaCalendarCheck', icon: FaIcons.FaCalendarCheck, name: 'Event' },
      { id: 'FaHourglass', icon: FaIcons.FaHourglass, name: 'Hourglass' },
      { id: 'FaStopwatch', icon: FaIcons.FaStopwatch, name: 'Stopwatch' },
      { id: 'FaHistory', icon: FaIcons.FaHistory, name: 'History' },
      { id: 'FaCalendarDay', icon: FaIcons.FaCalendarDay, name: 'Day' },
      { id: 'FaCalendarWeek', icon: FaIcons.FaCalendarWeek, name: 'Week' },
      { id: 'FaRegCalendarPlus', icon: FaIcons.FaRegCalendarPlus, name: 'Add Event' },
      { id: 'FaAlarm', icon: MdIcons.MdAlarm, name: 'Alarm' },
      { id: 'FaTimeline', icon: MdIcons.MdTimeline, name: 'Timeline' },
      { id: 'FaSchedule', icon: MdIcons.MdSchedule, name: 'Schedule' },
    ]
  },
  food: {
    name: '🍕 Food & Drink',
    icons: [
      { id: 'FaPizzaSlice', icon: FaIcons.FaPizzaSlice, name: 'Pizza' },
      { id: 'FaHamburger', icon: FaIcons.FaHamburger, name: 'Burger' },
      { id: 'FaCoffee', icon: FaIcons.FaCoffee, name: 'Coffee' },
      { id: 'FaIceCream', icon: FaIcons.FaIceCream, name: 'Ice Cream' },
      { id: 'FaCookie', icon: FaIcons.FaCookie, name: 'Cookie' },
      { id: 'FaAppleAlt', icon: FaIcons.FaAppleAlt, name: 'Apple' },
      { id: 'FaCarrot', icon: FaIcons.FaCarrot, name: 'Carrot' },
      { id: 'FaWineGlass', icon: FaIcons.FaWineGlass, name: 'Wine' },
      { id: 'FaBeer', icon: FaIcons.FaBeer, name: 'Beer' },
      { id: 'FaCocktail', icon: FaIcons.FaCocktail, name: 'Cocktail' },
      { id: 'FaUtensils', icon: FaIcons.FaUtensils, name: 'Utensils' },
      { id: 'GiCupcake', icon: GiIcons.GiCupcake, name: 'Cupcake' },
    ]
  },
  weather: {
    name: '🌤️ Weather & Nature',
    icons: [
      { id: 'FaSun', icon: FaIcons.FaSun, name: 'Sun' },
      { id: 'FaMoon', icon: FaIcons.FaMoon, name: 'Moon' },
      { id: 'FaCloud', icon: FaIcons.FaCloud, name: 'Cloud' },
      { id: 'FaCloudSun', icon: FaIcons.FaCloudSun, name: 'Partly Cloudy' },
      { id: 'FaSnowflake', icon: FaIcons.FaSnowflake, name: 'Snow' },
      { id: 'FaUmbrella', icon: FaIcons.FaUmbrella, name: 'Umbrella' },
      { id: 'FaWind', icon: FaIcons.FaWind, name: 'Wind' },
      { id: 'FaLeaf', icon: FaIcons.FaLeaf, name: 'Leaf' },
      { id: 'FaTree', icon: FaIcons.FaTree, name: 'Tree' },
      { id: 'FaSeedling', icon: FaIcons.FaSeedling, name: 'Seedling' },
      { id: 'FaMountain', icon: FaIcons.FaMountain, name: 'Mountain' },
      { id: 'FaWater', icon: FaIcons.FaWater, name: 'Water' },
    ]
  },
  travel: {
    name: '✈️ Travel',
    icons: [
      { id: 'FaPlane', icon: FaIcons.FaPlane, name: 'Plane' },
      { id: 'FaCar', icon: FaIcons.FaCar, name: 'Car' },
      { id: 'FaTrain', icon: FaIcons.FaTrain, name: 'Train' },
      { id: 'FaShip', icon: FaIcons.FaShip, name: 'Ship' },
      { id: 'FaBicycle', icon: FaIcons.FaBicycle, name: 'Bicycle' },
      { id: 'FaMapMarkerAlt', icon: FaIcons.FaMapMarkerAlt, name: 'Location' },
      { id: 'FaGlobeAmericas', icon: FaIcons.FaGlobeAmericas, name: 'Globe' },
      { id: 'FaPassport', icon: FaIcons.FaPassport, name: 'Passport' },
      { id: 'FaSuitcase', icon: FaIcons.FaSuitcase, name: 'Suitcase' },
      { id: 'FaHotel', icon: FaIcons.FaHotel, name: 'Hotel' },
      { id: 'FaUmbrellaBeach', icon: FaIcons.FaUmbrellaBeach, name: 'Beach' },
      { id: 'FaCampground', icon: FaIcons.FaCampground, name: 'Camp' },
    ]
  },
  health: {
    name: '💪 Health & Fitness',
    icons: [
      { id: 'FaHeartbeat', icon: FaIcons.FaHeartbeat, name: 'Heartbeat' },
      { id: 'FaDumbbell', icon: FaIcons.FaDumbbell, name: 'Dumbbell' },
      { id: 'FaRunning', icon: FaIcons.FaRunning, name: 'Running' },
      { id: 'FaBiking', icon: FaIcons.FaBiking, name: 'Biking' },
      { id: 'FaSwimmer', icon: FaIcons.FaSwimmer, name: 'Swimming' },
      { id: 'FaAppleAlt', icon: FaIcons.FaAppleAlt, name: 'Healthy' },
      { id: 'FaMedkit', icon: FaIcons.FaMedkit, name: 'Medkit' },
      { id: 'FaPills', icon: FaIcons.FaPills, name: 'Pills' },
      { id: 'FaSpa', icon: FaIcons.FaSpa, name: 'Spa' },
      { id: 'FaYinYang', icon: FaIcons.FaYinYang, name: 'Balance' },
      { id: 'GiMeditation', icon: GiIcons.GiMeditation, name: 'Meditation' },
      { id: 'GiYoga', icon: GiIcons.GiStairsGoal, name: 'Goal' },
    ]
  },
  tech: {
    name: '💻 Technology',
    icons: [
      { id: 'FaLaptop', icon: FaIcons.FaLaptop, name: 'Laptop' },
      { id: 'FaMobile', icon: FaIcons.FaMobileAlt, name: 'Mobile' },
      { id: 'FaDesktop', icon: FaIcons.FaDesktop, name: 'Desktop' },
      { id: 'FaTablet', icon: FaIcons.FaTabletAlt, name: 'Tablet' },
      { id: 'FaWifi', icon: FaIcons.FaWifi, name: 'WiFi' },
      { id: 'FaCode', icon: FaIcons.FaCode, name: 'Code' },
      { id: 'FaDatabase', icon: FaIcons.FaDatabase, name: 'Database' },
      { id: 'FaCloud', icon: FaIcons.FaCloud, name: 'Cloud' },
      { id: 'FaRobot', icon: FaIcons.FaRobot, name: 'Robot' },
      { id: 'FaMicrochip', icon: FaIcons.FaMicrochip, name: 'Chip' },
      { id: 'FaGamepad', icon: FaIcons.FaGamepad, name: 'Gaming' },
      { id: 'FaVrCardboard', icon: FaIcons.FaVrCardboard, name: 'VR' },
    ]
  },
  social: {
    name: '👥 Social',
    icons: [
      { id: 'FaUsers', icon: FaIcons.FaUsers, name: 'Users' },
      { id: 'FaUserFriends', icon: FaIcons.FaUserFriends, name: 'Friends' },
      { id: 'FaHandshake', icon: FaIcons.FaHandshake, name: 'Handshake' },
      { id: 'FaComments', icon: FaIcons.FaComments, name: 'Chat' },
      { id: 'FaShare', icon: FaIcons.FaShare, name: 'Share' },
      { id: 'FaRetweet', icon: FaIcons.FaRetweet, name: 'Retweet' },
      { id: 'FaAt', icon: FaIcons.FaAt, name: 'Mention' },
      { id: 'FaHashtag', icon: FaIcons.FaHashtag, name: 'Hashtag' },
      { id: 'FaHeart', icon: FaIcons.FaHeart, name: 'Like' },
      { id: 'FaUserPlus', icon: FaIcons.FaUserPlus, name: 'Follow' },
      { id: 'FaSmile', icon: FaIcons.FaSmile, name: 'Smile' },
      { id: 'FaLaugh', icon: FaIcons.FaLaugh, name: 'Laugh' },
    ]
  },
  business: {
    name: '💼 Business',
    icons: [
      { id: 'FaBriefcase', icon: FaIcons.FaBriefcase, name: 'Briefcase' },
      { id: 'FaBuilding', icon: FaIcons.FaBuilding, name: 'Building' },
      { id: 'FaChartLine', icon: FaIcons.FaChartLine, name: 'Growth' },
      { id: 'FaChartBar', icon: FaIcons.FaChartBar, name: 'Chart' },
      { id: 'FaChartPie', icon: FaIcons.FaChartPie, name: 'Pie Chart' },
      { id: 'FaHandshake', icon: FaIcons.FaHandshake, name: 'Deal' },
      { id: 'FaFileContract', icon: FaIcons.FaFileContract, name: 'Contract' },
      { id: 'FaClipboardCheck', icon: FaIcons.FaClipboardCheck, name: 'Checklist' },
      { id: 'FaTasks', icon: FaIcons.FaTasks, name: 'Tasks' },
      { id: 'FaProjectDiagram', icon: FaIcons.FaProjectDiagram, name: 'Project' },
      { id: 'FaLightbulb', icon: FaIcons.FaLightbulb, name: 'Innovation' },
      { id: 'FaAward', icon: FaIcons.FaAward, name: 'Award' },
    ]
  },
  arrows: {
    name: '➡️ Arrows & Direction',
    icons: [
      { id: 'FaArrowRight', icon: FaIcons.FaArrowRight, name: 'Right' },
      { id: 'FaArrowLeft', icon: FaIcons.FaArrowLeft, name: 'Left' },
      { id: 'FaArrowUp', icon: FaIcons.FaArrowUp, name: 'Up' },
      { id: 'FaArrowDown', icon: FaIcons.FaArrowDown, name: 'Down' },
      { id: 'FaChevronRight', icon: FaIcons.FaChevronRight, name: 'Chevron Right' },
      { id: 'FaChevronLeft', icon: FaIcons.FaChevronLeft, name: 'Chevron Left' },
      { id: 'FaAngleDoubleRight', icon: FaIcons.FaAngleDoubleRight, name: 'Fast Forward' },
      { id: 'FaLongArrowAltRight', icon: FaIcons.FaLongArrowAltRight, name: 'Long Arrow' },
      { id: 'FaExternalLinkAlt', icon: FaIcons.FaExternalLinkAlt, name: 'External' },
      { id: 'FaExpandAlt', icon: FaIcons.FaExpandAlt, name: 'Expand' },
      { id: 'FaSyncAlt', icon: FaIcons.FaSyncAlt, name: 'Refresh' },
      { id: 'FaRedo', icon: FaIcons.FaRedo, name: 'Redo' },
    ]
  },
  emojis: {
    name: '😊 Emojis',
    icons: [
      { id: 'emoji-star', icon: () => <span className="text-lg">⭐</span>, name: 'Star', isEmoji: true, value: '⭐' },
      { id: 'emoji-fire', icon: () => <span className="text-lg">🔥</span>, name: 'Fire', isEmoji: true, value: '🔥' },
      { id: 'emoji-heart', icon: () => <span className="text-lg">❤️</span>, name: 'Heart', isEmoji: true, value: '❤️' },
      { id: 'emoji-sparkles', icon: () => <span className="text-lg">✨</span>, name: 'Sparkles', isEmoji: true, value: '✨' },
      { id: 'emoji-rocket', icon: () => <span className="text-lg">🚀</span>, name: 'Rocket', isEmoji: true, value: '🚀' },
      { id: 'emoji-gift', icon: () => <span className="text-lg">🎁</span>, name: 'Gift', isEmoji: true, value: '🎁' },
      { id: 'emoji-party', icon: () => <span className="text-lg">🎉</span>, name: 'Party', isEmoji: true, value: '🎉' },
      { id: 'emoji-crown', icon: () => <span className="text-lg">👑</span>, name: 'Crown', isEmoji: true, value: '👑' },
      { id: 'emoji-trophy', icon: () => <span className="text-lg">🏆</span>, name: 'Trophy', isEmoji: true, value: '🏆' },
      { id: 'emoji-money', icon: () => <span className="text-lg">💰</span>, name: 'Money', isEmoji: true, value: '💰' },
      { id: 'emoji-bell', icon: () => <span className="text-lg">🔔</span>, name: 'Bell', isEmoji: true, value: '🔔' },
      { id: 'emoji-megaphone', icon: () => <span className="text-lg">📢</span>, name: 'Megaphone', isEmoji: true, value: '📢' },
      { id: 'emoji-lightning', icon: () => <span className="text-lg">⚡</span>, name: 'Lightning', isEmoji: true, value: '⚡' },
      { id: 'emoji-100', icon: () => <span className="text-lg">💯</span>, name: '100', isEmoji: true, value: '💯' },
      { id: 'emoji-check', icon: () => <span className="text-lg">✅</span>, name: 'Check', isEmoji: true, value: '✅' },
      { id: 'emoji-new', icon: () => <span className="text-lg">🆕</span>, name: 'New', isEmoji: true, value: '🆕' },
      { id: 'emoji-hot', icon: () => <span className="text-lg">🔥</span>, name: 'Hot', isEmoji: true, value: '🔥' },
      { id: 'emoji-eyes', icon: () => <span className="text-lg">👀</span>, name: 'Eyes', isEmoji: true, value: '👀' },
      { id: 'emoji-wave', icon: () => <span className="text-lg">👋</span>, name: 'Wave', isEmoji: true, value: '👋' },
      { id: 'emoji-clap', icon: () => <span className="text-lg">👏</span>, name: 'Clap', isEmoji: true, value: '👏' },
      { id: 'emoji-thumbsup', icon: () => <span className="text-lg">👍</span>, name: 'Thumbs Up', isEmoji: true, value: '👍' },
      { id: 'emoji-love', icon: () => <span className="text-lg">😍</span>, name: 'Love', isEmoji: true, value: '😍' },
      { id: 'emoji-sunglasses', icon: () => <span className="text-lg">😎</span>, name: 'Cool', isEmoji: true, value: '😎' },
      { id: 'emoji-thinking', icon: () => <span className="text-lg">🤔</span>, name: 'Thinking', isEmoji: true, value: '🤔' },
    ]
  },
};

function IconLibrary({ onSelectIcon, onClose, currentIcon }) {
  const [activeCategory, setActiveCategory] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');

  // Get all icons for search
  const allIcons = useMemo(() => {
    const icons = [];
    Object.entries(ICON_CATEGORIES).forEach(([catKey, category]) => {
      category.icons.forEach(icon => {
        icons.push({ ...icon, category: catKey, categoryName: category.name });
      });
    });
    return icons;
  }, []);

  // Filter icons by search
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) {
      return ICON_CATEGORIES[activeCategory]?.icons || [];
    }
    const query = searchQuery.toLowerCase();
    return allIcons.filter(icon => 
      icon.name.toLowerCase().includes(query) ||
      icon.id.toLowerCase().includes(query)
    );
  }, [searchQuery, activeCategory, allIcons]);

  const handleSelect = useCallback((icon) => {
    onSelectIcon({
      id: icon.id,
      name: icon.name,
      isEmoji: icon.isEmoji || false,
      value: icon.value || icon.id
    });
  }, [onSelectIcon]);

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-[400px] max-h-[500px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <h3 className="text-sm font-semibold text-zinc-800">Icon Library</h3>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-zinc-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search icons..."
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#04D1FC] focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories */}
      {!searchQuery && (
        <div className="flex gap-1 px-4 py-2 overflow-x-auto border-b border-zinc-100 scrollbar-hide">
          {Object.entries(ICON_CATEGORIES).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                activeCategory === key
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {/* Icons Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {searchQuery && (
          <p className="text-xs text-zinc-400 mb-2">
            Found {filteredIcons.length} icons
          </p>
        )}
        <div className="grid grid-cols-6 gap-2">
          {filteredIcons.map((icon) => {
            const IconComponent = icon.icon;
            const isSelected = currentIcon === icon.id || currentIcon === icon.value;
            
            return (
              <button
                key={icon.id}
                onClick={() => handleSelect(icon)}
                className={cn(
                  "aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all hover:scale-105",
                  isSelected
                    ? "bg-[#04D1FC] text-white ring-2 ring-[#04D1FC] ring-offset-2"
                    : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
                )}
                title={icon.name}
              >
                <IconComponent className="w-5 h-5" />
              </button>
            );
          })}
        </div>
        
        {filteredIcons.length === 0 && (
          <div className="text-center py-8 text-zinc-400">
            <p className="text-sm">No icons found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50">
        <p className="text-[10px] text-zinc-400 text-center">
          Click an icon to add it to your marquee
        </p>
      </div>
    </div>
  );
}

// Export the icon categories for use elsewhere
export { ICON_CATEGORIES };
export default IconLibrary;

