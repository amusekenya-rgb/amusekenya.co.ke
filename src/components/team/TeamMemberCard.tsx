
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, Trophy, Heart, Users, Briefcase, Leaf } from 'lucide-react';

interface TeamMemberCardProps {
  member: {
    id: string;
    name: string;
    role: string;
    bio: string;
    image: string;
    specialization: string;
    icon: string;
  };
  index: number;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, index }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const renderIcon = (iconName: string) => {
    const iconProps = { className: "h-4 w-4 text-forest-500" };
    
    switch(iconName) {
      case 'Trophy':
        return <Trophy {...iconProps} />;
      case 'Heart':
        return <Heart {...iconProps} />;
      case 'Briefcase':
        return <Briefcase {...iconProps} />;
      case 'Leaf':
        return <Leaf {...iconProps} />;
      case 'Users':
        return <Users {...iconProps} />;
      default:
        return <Trophy {...iconProps} />;
    }
  };

  return (
    <Card 
      key={member.id || index} 
      className="fade-in-element opacity-0 transform translate-y-10 hover:shadow-lg transition-all duration-700"
      style={{ transitionDelay: `${0.1 * (index + 1)}s` }}
    >
      <div className="relative overflow-hidden aspect-square">
        <div 
          className={`w-full h-full bg-gray-200 absolute top-0 left-0 transition-opacity duration-500 ${
            isImageLoaded ? 'opacity-0' : 'opacity-100'
          }`}
        ></div>
        <img 
          src={member.image} 
          alt={member.name} 
          className="w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: isImageLoaded ? 1 : 0 }}
          onLoad={() => setIsImageLoaded(true)}
          onError={(e) => {
            // Fallback for broken images
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d';
            setIsImageLoaded(true);
          }}
        />
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
        <p className="text-forest-600 font-medium mb-3">{member.role}</p>
        <p className="text-gray-600 text-sm mb-4">{member.bio}</p>
        
        <div className="flex items-center text-sm text-gray-700 mb-4">
          {renderIcon(member.icon)}
          <span className="ml-2">{member.specialization}</span>
        </div>
        
        <div className="flex space-x-3 mt-4">
          <button className="text-gray-600 hover:text-forest-600 transition-colors">
            <Mail className="h-4 w-4" />
          </button>
          <button className="text-gray-600 hover:text-forest-600 transition-colors">
            <Phone className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
