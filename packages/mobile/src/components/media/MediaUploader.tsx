import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import localMediaApi from '../../api/local-media.api';
import { MediaType, UploadStatus, MediaConfirmResponse } from '../../types/media.types';
import { Colors, Spacing, FontSizes } from '../../styles';

interface MediaUploaderProps {
  folder: string;
  mediaType: MediaType;
  maxSizeInMB?: number;
  onUploadComplete?: (result: MediaConfirmResponse) => void;
  onError?: (error: Error) => void;
  title?: string;
  description?: string;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  folder,
  mediaType,
  maxSizeInMB = 10,
  onUploadComplete,
  onError,
  title = 'Upload Media',
  description = 'Tap to select a file'
}) => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<MediaConfirmResponse | null>(null);

  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  // Request permissions
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need media library permissions to make this work!'
        );
        return false;
      }
      return true;
    }
    return true;
  };

  // Select and upload media
  const handleSelectMedia = useCallback(async () => {
    // Don't allow selection while uploading
    if (uploadStatus === 'uploading' || uploadStatus === 'processing') {
      return;
    }

    // Request permissions
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    // Configure options based on media type
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: 
        mediaType === 'video' 
          ? ImagePicker.MediaTypeOptions.Videos
          : mediaType === 'gif'
            ? ImagePicker.MediaTypeOptions.All // GIFs are under All
            : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: mediaType !== 'gif', // Don't allow editing for GIFs
      quality: 1,
    };

    try {
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync(options);
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const selectedAsset = result.assets[0];
      const uri = selectedAsset.uri;
      
      // Set preview
      setPreviewUri(uri);
      setUploadStatus('uploading');
      setUploadProgress(0);

      // Check file size
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      // Check if the file exists and if it has a size property
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
      
      // Now TypeScript knows fileInfo has the 'exists: true' type which includes size
      if (fileInfo.size && fileInfo.size > maxSizeInBytes) {
        throw new Error(`File size exceeds the limit of ${maxSizeInMB}MB`);
      }

      // Extract file name from URI
      const fileName = uri.split('/').pop() || `file-${Date.now()}`;
      
      // Start upload with progress tracking
      setUploadProgress(10); // Initial progress

      // Upload the file
      setUploadStatus('uploading');
      setUploadProgress(30);

      const uploadResponse = await localMediaApi.uploadMedia(
        uri,
        fileName,
        folder,
        mediaType
      );
      
      setUploadStatus('success');
      setUploadProgress(100);
      setUploadResult(uploadResponse);

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(uploadResponse);
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      setUploadStatus('error');
      setUploadProgress(0);
      
      // Notify parent component
      if (onError && error instanceof Error) {
        onError(error);
      }
      
      Alert.alert('Upload Failed', error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }, [folder, mediaType, maxSizeInBytes, onUploadComplete, onError, uploadStatus]);

  // Handle retry
  const handleRetry = () => {
    setUploadStatus('idle');
    setUploadProgress(0);
    setPreviewUri(null);
    setUploadResult(null);
  };

  // Render content based on status
  const renderContent = () => {
    switch (uploadStatus) {
      case 'idle':
        return (
          <TouchableOpacity style={styles.container} onPress={handleSelectMedia}>
            <View style={styles.uploadContainer}>
              <Ionicons name="cloud-upload-outline" size={48} color={Colors.primary} />
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>
              {mediaType === 'image' && (
                <Text style={styles.hint}>Select an image (JPG, PNG, WebP)</Text>
              )}
              {mediaType === 'gif' && (
                <Text style={styles.hint}>Select a GIF file</Text>
              )}
              {mediaType === 'video' && (
                <Text style={styles.hint}>Select a video (MP4, WebM)</Text>
              )}
            </View>
          </TouchableOpacity>
        );
        
      case 'uploading':
      case 'processing':
        return (
          <View style={styles.container}>
            <View style={styles.uploadContainer}>
              {previewUri && (
                <Image source={{ uri: previewUri }} style={styles.preview} />
              )}
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.status}>
                {uploadStatus === 'uploading' ? 'Uploading...' : 'Processing...'}
              </Text>
              <View style={styles.progressContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${uploadProgress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{uploadProgress}%</Text>
            </View>
          </View>
        );
        
      case 'success':
        return (
          <View style={styles.container}>
            <View style={styles.uploadContainer}>
              {uploadResult && mediaType === 'image' && uploadResult.processed.mobile && (
                <Image 
                  source={{ uri: uploadResult.processed.mobile.url }} 
                  style={styles.preview} 
                />
              )}
              {uploadResult && mediaType === 'gif' && uploadResult.processed.gif && (
                <Image 
                  source={{ uri: uploadResult.processed.gif.url }} 
                  style={styles.preview} 
                />
              )}
              {uploadResult && mediaType === 'video' && uploadResult.processed.thumbnail && (
                <Image 
                  source={{ uri: uploadResult.processed.thumbnail.url }} 
                  style={styles.preview} 
                />
              )}
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
              <Text style={styles.status}>Upload Complete</Text>
              <TouchableOpacity style={styles.button} onPress={handleRetry}>
                <Text style={styles.buttonText}>Upload Another</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
        
      case 'error':
        return (
          <View style={styles.container}>
            <View style={styles.uploadContainer}>
              <Ionicons name="alert-circle" size={48} color={Colors.error} />
              <Text style={styles.status}>Upload Failed</Text>
              <TouchableOpacity style={styles.button} onPress={handleRetry}>
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
    }
  };

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 2,
    borderRadius: 8,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    padding: Spacing.medium,
  },
  uploadContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.medium,
  },
  title: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    marginTop: Spacing.small,
    color: Colors.text,
  },
  description: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xsmall,
  },
  hint: {
    fontSize: FontSizes.small,
    color: Colors.textTertiary,
    marginTop: Spacing.medium,
  },
  preview: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: Spacing.medium,
  },
  status: {
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
    marginTop: Spacing.small,
    color: Colors.text,
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    marginTop: Spacing.medium,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xsmall,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 4,
    marginTop: Spacing.medium,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});

export default MediaUploader;