import React from 'react';
import TextSection from '../sections/TextSection';
import SectionHeaderSection from '../sections/SectionHeaderSection';
import ImageCollageSection from '../sections/ImageCollageSection';
import ImageSequenceSection from '../sections/ImageSequenceSection';
import MarqueeSection from '../sections/MarqueeSection';
import AccentTextSection from '../sections/AccentTextSection';
import PromoCardSection from '../sections/PromoCardSection';
import ProfileCardsSection from '../sections/ProfileCardsSection';
import RecipeSection from '../sections/RecipeSection';

import LogoBlock from './LogoBlock';
import ImageBlock from './ImageBlock';
import ButtonBlock from './ButtonBlock';
import DividerBlock from './DividerBlock';
import SpacerBlock from './SpacerBlock';
import SocialLinksBlock from './SocialLinksBlock';
import FooterLinksBlock from './FooterLinksBlock';
import CompanyInfoBlock from './CompanyInfoBlock';
import TitleBlock from './TitleBlock';
import MultiLayoutBlock from './MultiLayoutBlock';
import ImageGridBlock from './ImageGridBlock';
import AnimatedTextBlock from './AnimatedTextBlock';

// Maps block.type → React component.
// Existing section components are reused directly; simple blocks are new.
const blockComponents = {
  text:          TextSection,
  title:         TitleBlock,
  image:         ImageBlock,
  imageGrid:     ImageGridBlock,
  imageCollage:  ImageCollageSection,
  imageSequence: ImageSequenceSection,
  marquee:       MarqueeSection,
  animatedText:  AnimatedTextBlock,
  promoCard:     PromoCardSection,
  profileCards:  ProfileCardsSection,
  recipe:        RecipeSection,
  multiLayout:   MultiLayoutBlock,
  button:        ButtonBlock,
  divider:       DividerBlock,
  spacer:        SpacerBlock,
  logo:          LogoBlock,
  socialLinks:   SocialLinksBlock,
  footerLinks:   FooterLinksBlock,
  companyInfo:   CompanyInfoBlock,
};

export default function BlockRenderer({
  block,
  isSelected,
  isSectionSelected,
  onClick,
  sectionBackground,
  draggable = false,
  onDragStart,
  onDragEnd,
  onSetImage,
  onSetCollageImage,
  onSetLayoutImage,
}) {
  const Component = blockComponents[block.type];

  if (!Component) {
    return (
      <div
        style={{
          padding: 12,
          background: '#FEF2F2',
          color: '#DC2626',
          fontSize: 13,
          borderRadius: 4,
        }}
      >
        Unknown block type: {block.type}
      </div>
    );
  }

  const { id, type, ...props } = block;

  return (
    <div
      data-block-id={id}
      draggable={draggable && isSectionSelected}
      onDragStart={draggable && isSectionSelected ? (e) => onDragStart?.(e, id) : undefined}
      onDragEnd={draggable && isSectionSelected ? () => onDragEnd?.() : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(id);
      }}
      style={{
        position: 'relative',
        cursor: draggable && isSectionSelected ? 'grab' : 'pointer',
        outline: isSelected ? '2px solid #04D1FC' : 'none',
        outlineOffset: isSelected ? 2 : 0,
        borderRadius: isSelected ? 2 : 0,
        transition: 'outline 0.15s',
      }}
    >
      <Component
        {...props}
        sectionBackground={sectionBackground}
        onSetImage={block.type === 'image' ? onSetImage : undefined}
        onSetCollageImage={block.type === 'imageCollage' ? onSetCollageImage : undefined}
        onSetLayoutImage={(block.type === 'multiLayout' || block.type === 'imageGrid') ? onSetLayoutImage : undefined}
      />
    </div>
  );
}

export { blockComponents };
