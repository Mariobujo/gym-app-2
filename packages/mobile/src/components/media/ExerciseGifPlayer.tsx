import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Text,
  TouchableOpacity,
  Platform,
  ViewStyle,
  StyleProp,
  ImageStyle,
  DimensionValue
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { ExerciseGifFormats } from '../../types/media.types';
import { Colors, Spacing, FontSizes } from '../../styles';
import NetInfo from '@react-native-community/netinfo';

interface ExerciseGifPlayerProps {
  formats: ExerciseGifFormats;
  autoPlay?: boolean;
  loop?: boolean;
  width?: number | string;
  height?: number | string;
  style?: StyleProp<ViewStyle>;
  showControls?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Helper function to convert width/height to DimensionValue
const toDimension = (value: number | string | undefined): DimensionValue | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  // For percentages and other string values, we can return them directly
  // as React Native can handle percentage strings
  return value as DimensionValue;
};

const ExerciseGifPlayer: React.FC<ExerciseGifPlayerProps> = ({
  formats,
  autoPlay = true,
  loop = true,
  width = '100%',
  height = 200,
  style,
  showControls = true,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferredFormat, setPreferredFormat] = useState<'gif' | 'webp' | 'mp4'>('webp');
  
  // Convert width and height to DimensionValue
  const dimensionWidth = toDimension(width);
  const dimensionHeight = toDimension(height);
  
  // Create dimension style objects
  const dimensionStyle = StyleSheet.create({
    dimensions: {
      width: dimensionWidth,
      height: dimensionHeight
    }
  });
  
  // Subscribe to connectivity changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Determine best format to use based on platform and connection
  useEffect(() => {
    const determineFormat = async () => {
      // On web, prefer WebP (modern browsers) or GIF (fallback)
      if (Platform.OS === 'web') {
        // Check if browser supports WebP
        const webpSupported = document.createElement('canvas')
          .toDataURL('image/webp')
          .indexOf('data:image/webp') === 0;
        
        setPreferredFormat(webpSupported ? 'webp' : 'gif');
        return;
      }
      
      // On mobile, check connection
      const netInfo = await NetInfo.fetch();
      
      // On slow connections, prefer static images or smaller formats
      if (netInfo.type === 'cellular' || !netInfo.isConnected) {
        setPreferredFormat('gif'); // GIFs can be smaller than videos sometimes
      } else {
        // On good connections, prefer MP4 for better performance
        setPreferredFormat('mp4');
      }
    };
    
    determineFormat();
  }, [isConnected]);
  
  // Handle errors
  const handleError = (error: any) => {
    console.error('Error loading exercise media:', error);
    setError('Failed to load media');
    setIsLoading(false);
    if (onError) {
      onError(new Error('Failed to load media'));
    }
  };
  
  // Handle successful load
  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
    if (onLoad) {
      onLoad();
    }
  };
  
  // Toggle playback for videos
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Render based on preferred format
  const renderMedia = () => {
    if (error) {
      return (
        <View style={[styles.errorContainer, dimensionStyle.dimensions]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }
    
    if (isLoading) {
      return (
        <View style={[styles.loadingContainer, dimensionStyle.dimensions]}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }
    
    // Use video format
    if (preferredFormat === 'mp4' && formats.mp4) {
      return (
        <View style={dimensionStyle.dimensions}>
          <Video
            source={{ uri: formats.mp4.url }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={isPlaying}
            isLooping={loop}
            style={styles.video}
            onLoad={handleLoad}
            onError={(error) => handleError(error)}
            onLoadStart={() => setIsLoading(true)}
            onReadyForDisplay={() => setIsLoading(false)}
            useNativeControls={false}
          />
          
          {showControls && (
            <TouchableOpacity 
              style={styles.playButton} 
              onPress={togglePlayback}
              activeOpacity={0.7}
            >
              <View style={styles.playButtonInner}>
                <Text style={styles.playButtonText}>
                  {isPlaying ? "❚❚" : "▶"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    
    // Use WebP format
    if (preferredFormat === 'webp' && formats.webp) {
      return (
        <Image
          source={{ uri: formats.webp.url }}
          style={[styles.image, dimensionStyle.dimensions]}
          resizeMode="contain"
          onLoad={handleLoad}
          onError={(error) => handleError(error)}
        />
      );
    }
    
    // Use GIF format (fallback)
    return (
      <Image
        source={{ uri: formats.gif.url }}
        style={[styles.image, dimensionStyle.dimensions]}
        resizeMode="contain"
        onLoad={handleLoad}
        onError={(error) => handleError(error)}
      />
    );
  };
  
  return (
    <View style={[styles.container, style, dimensionStyle.dimensions]}>
      {renderMedia()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.medium,
  },
  image: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  video: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  playButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    color: Colors.white,
    fontSize: FontSizes.medium,
  },
});

export default ExerciseGifPlayer;