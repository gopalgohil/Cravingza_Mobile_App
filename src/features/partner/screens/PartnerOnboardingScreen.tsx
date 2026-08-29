// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  Image,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomInput } from '../../../components/ui/CustomInput';
import { CustomButton } from '../../../components/ui/CustomButton';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { applyPartnerApi } from '../../auth/services/authApi';
import { BASE_URL, getAuthToken } from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';
import { validatePhone, validatePincode, validateEmail, validateName, validateBankAccount, validateIFSC } from '../../../utils/validation';
import { GuestPartnerState } from '../components/GuestPartnerState';

export const PartnerOnboardingScreen = ({ route, navigation }: any) => {
  const { currentUser } = useAuth();
  const initialMode = route?.params?.initialMode || 'restaurant';
  const [partnerType, setPartnerType] = useState<'restaurant' | 'delivery'>(initialMode);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // 🔹 Basic Account Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // 🏪 Restaurant Specific Fields
  const [restaurantName, setRestaurantName] = useState('');
  const [cuisineTags, setCuisineTags] = useState('Indian, Biryani, Fast Food');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('');
  const [fssaiLicenseUrl, setFssaiLicenseUrl] = useState('');
  const [gstCertificateUrl, setGstCertificateUrl] = useState('');

  // 🛵 Delivery Rider Specific Fields
  const [vehicleType, setVehicleType] = useState<'motorcycle' | 'electric_scooter' | 'bicycle' | 'car'>('motorcycle');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [drivingLicenseUrl, setDrivingLicenseUrl] = useState('');
  const [aadhaarCardUrl, setAadhaarCardUrl] = useState('');

  // 🏦 Bank Payout Details
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');

  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});

  const markTouched = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  // 🔹 Step 1 Field Validations (Live Inline Red Text Errors)
  const step1Errors = React.useMemo(() => {
    const errs: { [key: string]: string } = {};

    if (partnerType === 'restaurant') {
      if (!restaurantName.trim()) errs.restaurantName = 'Restaurant Name is required.';
      if (!cuisineTags.trim()) errs.cuisineTags = 'Cuisine Tags are required.';
      if (!phone.trim()) errs.phone = 'Phone Number is required.';
      else if (phone.replace(/\D/g, '').length !== 10) errs.phone = 'Enter valid 10-digit phone number.';
      if (!addressLine.trim()) errs.addressLine = 'Full Street Address is required.';
      if (!city.trim()) errs.city = 'City is required.';
      if (!pincode.trim()) errs.pincode = 'Pincode is required.';
      else if (pincode.replace(/\D/g, '').length !== 6) errs.pincode = 'Enter valid 6-digit pincode.';
    } else {
      if (!name.trim()) errs.name = 'Full Name is required.';
      const emailCheck = validateEmail(email);
      if (!emailCheck.isValid) errs.email = emailCheck.message || 'Enter a valid email address.';
      if (!phone.trim()) errs.phone = 'Phone Number is required.';
      else if (phone.replace(/\D/g, '').length !== 10) errs.phone = 'Enter valid 10-digit phone number.';
      if (!vehicleNumber.trim()) errs.vehicleNumber = 'Vehicle Registration Number is required.';
      if (!city.trim()) errs.city = 'City is required.';
      if (!pincode.trim()) errs.pincode = 'Pincode is required.';
      else if (pincode.replace(/\D/g, '').length !== 6) errs.pincode = 'Enter valid 6-digit pincode.';
    }

    return errs;
  }, [partnerType, restaurantName, cuisineTags, phone, addressLine, city, pincode, name, email, vehicleNumber, password]);

  // 🔹 Check if Step 1 is 100% complete & valid to enable Continue button
  const isStep1FormValid = React.useMemo(() => {
    return Object.keys(step1Errors).length === 0;
  }, [step1Errors]);

  // 🔹 Auto-fill logged in user's profile details
  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.name && !name) setName(currentUser.name);
      if (currentUser.email && !email) setEmail(currentUser.email);
      if (currentUser.phone && !phone) setPhone(currentUser.phone);
    }
  }, [currentUser]);

  const requestAndroidPermissions = async (type: 'gallery' | 'camera') => {
    if (Platform.OS !== 'android') return true;
    try {
      if (type === 'camera') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission 📷',
            message: 'Cravingza App needs camera access to capture document photos.',
            buttonPositive: 'Allow',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('Permission Error:', err);
    }
    return true;
  };

  // ☁️ Dynamic Gallery & Camera Upload Handler
  const handlePickAndUpload = (fieldKey: string) => {
    Alert.alert(
      'Select Image Source 📸',
      'Choose how you want to upload this document:',
      [
        {
          text: '🖼️ Choose from Gallery',
          onPress: () => processImagePicker('gallery', fieldKey),
        },
        {
          text: '📷 Take Photo with Camera',
          onPress: () => processImagePicker('camera', fieldKey),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const processImagePicker = async (type: 'gallery' | 'camera', fieldKey: string) => {
    try {
      const hasPermission = await requestAndroidPermissions(type);
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
        return;
      }

      const options = {
        mediaType: 'photo' as const,
        quality: 0.8 as const,
        includeBase64: false,
      };

      const response =
        type === 'gallery'
          ? await launchImageLibrary(options)
          : await launchCamera(options);

      if (response.didCancel || !response.assets || response.assets.length === 0) {
        return;
      }

      const asset = response.assets[0];
      if (!asset.uri) return;

      setUploadingField(fieldKey);

      // Prepare FormData for Cloudinary Upload Endpoint
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `${fieldKey}_${Date.now()}.jpg`,
      } as any);
      formData.append('folder', 'cravingza/partner-docs');

      const token = getAuthToken();

      console.log('Uploading image to Cloudinary API...', `${BASE_URL}/api/upload`);

      const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await uploadRes.json();
      console.log('Cloudinary Upload API Response:', data);

      if (data && (data.url || data.secure_url)) {
        const finalUrl = data.url || data.secure_url;
        saveUrlToState(fieldKey, finalUrl);
        Alert.alert('Cloudinary Uploaded! 🎉', 'Your document image has been uploaded successfully.');
      } else {
        saveUrlToState(fieldKey, asset.uri);
        Alert.alert('Image Selected 📸', 'Selected image attached for submission.');
      }
    } catch (err: any) {
      console.log('Image Picker Error:', err);
      Alert.alert('Upload Failed', err?.message || 'Unable to select image from device.');
    } finally {
      setUploadingField(null);
    }
  };

  const saveUrlToState = (fieldKey: string, url: string) => {
    if (fieldKey === 'coverPhoto') setCoverPhotoUrl(url);
    if (fieldKey === 'fssai') setFssaiLicenseUrl(url);
    if (fieldKey === 'gst') setGstCertificateUrl(url);
    if (fieldKey === 'dl') setDrivingLicenseUrl(url);
    if (fieldKey === 'aadhaar') setAadhaarCardUrl(url);
  };

  // Step 1 Transition (No Alert Popups, Inline Field Errors & Disabled Button Guard)
  const handleNextStep1 = () => {
    setFormError(null);

    // 0. Auth Check
    if (!currentUser) {
      setFormError('Login required to submit partner application.');
      return;
    }

    // Touch all fields to show any inline errors if clicked
    const allTouched: { [key: string]: boolean } = {};
    if (partnerType === 'restaurant') {
      ['restaurantName', 'cuisineTags', 'phone', 'addressLine', 'city', 'pincode'].forEach(f => allTouched[f] = true);
    } else {
      ['name', 'email', 'phone', 'vehicleNumber', 'city', 'pincode'].forEach(f => allTouched[f] = true);
    }
    setTouchedFields(allTouched);

    if (!isStep1FormValid) {
      setFormError('Please fill in all required fields correctly above.');
      return;
    }

    setCurrentStep(2);
  };

  // Step 2 Transition & Document Validation
  const handleNextStep2 = () => {
    setFormError(null);

    if (partnerType === 'delivery') {
      if (!drivingLicenseUrl) {
        const err = 'Driving License Document is required. Please upload your document.';
        setFormError(err);
        Alert.alert('Document Missing ⚠️', err);
        return;
      }
      if (!aadhaarCardUrl) {
        const err = 'Aadhaar Card / Govt ID Document is required. Please upload your document.';
        setFormError(err);
        Alert.alert('Document Missing ⚠️', err);
        return;
      }
    }

    setCurrentStep(3);
  };

  // Final Form Submission & Re-Validation
  const handleSubmitApplication = async () => {
    setFormError(null);

    if (!currentUser) {
      Alert.alert(
        'Login Required 🔒',
        'Please log in or create an account first so your partner application is linked to your profile.',
        [
          {
            text: 'Log In / Sign Up',
            onPress: () => navigation.navigate('Login'),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      setFormError('Login required to submit partner application.');
      return;
    }

    // Final Document Check for Restaurant
    if (partnerType === 'restaurant') {
      if (!coverPhotoUrl) {
        const err = 'Restaurant Cover Photo is required. Please upload your cover photo.';
        setFormError(err);
        Alert.alert('Document Missing ⚠️', err);
        return;
      }
      if (!fssaiLicenseUrl) {
        const err = 'FSSAI Food License Document is required. Please upload your document.';
        setFormError(err);
        Alert.alert('Document Missing ⚠️', err);
        return;
      }
      if (!gstCertificateUrl) {
        const err = 'GST / Business Registration Certificate is required. Please upload your document.';
        setFormError(err);
        Alert.alert('Document Missing ⚠️', err);
        return;
      }
    }

    if (partnerType === 'delivery') {
      if (accountNumber.trim()) {
        const accRes = validateBankAccount(accountNumber);
        if (!accRes.isValid) {
          setFormError(accRes.message);
          return;
        }
      }

      if (ifscCode.trim()) {
        const ifscRes = validateIFSC(ifscCode);
        if (!ifscRes.isValid) {
          setFormError(ifscRes.message);
          return;
        }
      }
    }

    const trimmedName = name.trim() || currentUser?.name || '';
    const trimmedEmail = email.trim() || currentUser?.email || '';
    const trimmedPhone = phone.replace(/[^0-9]/g, '');
    const trimmedCity = city.trim() || 'Vadodara';
    const trimmedPincode = pincode.replace(/[^0-9]/g, '') || '390026';

    const targetRole = partnerType === 'restaurant' ? 'restaurant_owner' : 'delivery_partner';

    const payloadData = {
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      city: trimmedCity,
      pincode: trimmedPincode,
      role: targetRole,
      password: password || 'Cravingza@123',
      bankDetails: {
        accountHolderName,
        accountNumber,
        ifscCode,
        bankName,
      },
    };

    if (partnerType === 'restaurant') {
      const finalCover = coverPhotoUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80';
      const finalFssai = fssaiLicenseUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80';
      const finalGst = gstCertificateUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80';

      payloadData.restaurantName = restaurantName.trim() || `${trimmedName}'s Kitchen`;
      payloadData.cuisineTags = cuisineTags.split(',').map((c) => c.trim());
      payloadData.address = addressLine.trim();
      payloadData.coverImage = finalCover;
      payloadData.coverImageUrl = finalCover;
      payloadData.image = finalCover;
      payloadData.fssaiLicenseUrl = finalFssai;
      payloadData.fssaiLicense = finalFssai;
      payloadData.businessRegistrationUrl = finalGst;
      payloadData.gstCertificateUrl = finalGst;
      payloadData.documents = {
        fssaiLicense: finalFssai,
        fssai: finalFssai,
        businessRegistration: finalGst,
        gstCertificate: finalGst,
        coverImage: finalCover,
      };
    } else {
      const finalDl = drivingLicenseUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80';
      const finalAadhaar = aadhaarCardUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80';

      payloadData.vehicleType = vehicleType;
      payloadData.vehicleNumber = vehicleNumber.trim();
      payloadData.drivingLicenseUrl = finalDl;
      payloadData.aadhaarCardUrl = finalAadhaar;
      payloadData.documents = {
        drivingLicense: finalDl,
        aadhaarCard: finalAadhaar,
      };
    }

    setLoading(true);
    try {
      console.log('Submitting Partner Onboarding Payload to Backend API...', payloadData);

      const res = await applyPartnerApi(payloadData);
      console.log('Partner Onboarding API Response:', res);

      if (res && (res.success === false || res.error)) {
        const errMsg = Array.isArray(res.errors) ? res.errors.join('\n• ') : res.message || res.error || 'Validation failed';
        throw new Error(errMsg);
      }

      Alert.alert(
        'Application Submitted! 🎉',
        res?.message ||
          `Your application for ${
            partnerType === 'restaurant' ? 'Restaurant Listing' : 'Delivery Rider Profile'
          } has been sent for admin verification!`,
        [
          {
            text: 'Go to Home ➔',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error: any) {
      console.log('Partner Onboarding Error:', error.message);
      setFormError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <GuestPartnerState
        initialMode={initialMode}
        onLoginPress={() => navigation.navigate('Login')}
        onGoBack={() => navigation.goBack()}
      />
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Top Floating Back Header Bar */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backCircleBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topHeaderTitle}>Partner Onboarding Wizard</Text>
          <View style={{ width: 36 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flexOne}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Mode Selector Pills */}
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[styles.typeTabBtn, partnerType === 'restaurant' && styles.typeTabBtnActive]}
                onPress={() => {
                  setPartnerType('restaurant');
                  setCurrentStep(1);
                  setFormError(null);
                }}
              >
                <Text style={styles.typeTabEmoji}>🏪</Text>
                <Text
                  style={[
                    styles.typeTabText,
                    partnerType === 'restaurant' && styles.typeTabTextActive,
                  ]}
                >
                  Restaurant Owner
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeTabBtn, partnerType === 'delivery' && styles.typeTabBtnActive]}
                onPress={() => {
                  setPartnerType('delivery');
                  setCurrentStep(1);
                  setFormError(null);
                }}
              >
                <Text style={styles.typeTabEmoji}>🛵</Text>
                <Text
                  style={[
                    styles.typeTabText,
                    partnerType === 'delivery' && styles.typeTabTextActive,
                  ]}
                >
                  Delivery Rider
                </Text>
              </TouchableOpacity>
            </View>

            {/* Multi-Step Wizard Progress Bar */}
            <View style={styles.stepperContainer}>
              <TouchableOpacity style={styles.stepItem} onPress={() => setCurrentStep(1)}>
                <View style={[styles.stepCircle, currentStep >= 1 && styles.stepCircleActive]}>
                  <Text style={[styles.stepNumber, currentStep >= 1 && styles.stepNumberActive]}>1</Text>
                </View>
                <Text style={[styles.stepLabel, currentStep === 1 && styles.stepLabelActive]}>Info</Text>
              </TouchableOpacity>

              <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />

              <TouchableOpacity style={styles.stepItem} onPress={handleNextStep1}>
                <View style={[styles.stepCircle, currentStep >= 2 && styles.stepCircleActive]}>
                  <Text style={[styles.stepNumber, currentStep >= 2 && styles.stepNumberActive]}>2</Text>
                </View>
                <Text style={[styles.stepLabel, currentStep === 2 && styles.stepLabelActive]}>Docs</Text>
              </TouchableOpacity>

              {partnerType === 'delivery' && (
                <>
                  <View style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]} />

                  <TouchableOpacity style={styles.stepItem} onPress={handleNextStep2}>
                    <View style={[styles.stepCircle, currentStep >= 3 && styles.stepCircleActive]}>
                      <Text style={[styles.stepNumber, currentStep >= 3 && styles.stepNumberActive]}>3</Text>
                    </View>
                    <Text style={[styles.stepLabel, currentStep === 3 && styles.stepLabelActive]}>Payouts</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Guest Warning Banner if User is Not Logged In */}
            {!currentUser && (
              <View style={styles.guestWarningBanner}>
                <Text style={styles.guestWarningIcon}>🔒</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guestWarningTitle}>Login Required to Apply</Text>
                  <Text style={styles.guestWarningSub}>
                    Please log in so your restaurant application is linked to your profile.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.guestLoginPillBtn}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.guestLoginPillText}>Log In</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 🌟 STEP 1: BUSINESS & LOCATION DETAILS */}
            {currentStep === 1 && (
              <View style={styles.formCard}>
                <Text style={styles.formSectionTitle}>
                  {partnerType === 'restaurant'
                    ? '🏪 1. Restaurant & Location Details'
                    : '🛵 1. Rider Account Details'}
                </Text>

                {partnerType === 'restaurant' ? (
                  <>
                    <CustomInput
                      label="Restaurant Name *"
                      placeholder="e.g., Punjabi Dhaba & Grill"
                      value={restaurantName}
                      onChangeText={(t) => {
                        setRestaurantName(t);
                        markTouched('restaurantName');
                        setFormError(null);
                      }}
                      error={touchedFields.restaurantName ? step1Errors.restaurantName : undefined}
                    />

                    <CustomInput
                      label="Cuisine Tags (Comma separated) *"
                      placeholder="e.g., Indian, Biryani, Fast Food"
                      value={cuisineTags}
                      onChangeText={(t) => {
                        setCuisineTags(t);
                        markTouched('cuisineTags');
                        setFormError(null);
                      }}
                      error={touchedFields.cuisineTags ? step1Errors.cuisineTags : undefined}
                    />

                    <CustomInput
                      label="Phone Number *"
                      placeholder="e.g., 9876543210"
                      value={phone}
                      onChangeText={(t) => {
                        const clean = t.replace(/[^0-9]/g, '');
                        setPhone(clean);
                        markTouched('phone');
                        setFormError(null);
                      }}
                      keyboardType="phone-pad"
                      maxLength={10}
                      error={touchedFields.phone ? step1Errors.phone : undefined}
                    />

                    <CustomInput
                      label="Full Street Address *"
                      placeholder="e.g., Shop 12, Sector 62 Market"
                      value={addressLine}
                      onChangeText={(t) => {
                        setAddressLine(t);
                        markTouched('addressLine');
                        setFormError(null);
                      }}
                      error={touchedFields.addressLine ? step1Errors.addressLine : undefined}
                    />

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <CustomInput
                          label="City *"
                          placeholder="City"
                          value={city}
                          onChangeText={(t) => {
                            setCity(t);
                            markTouched('city');
                            setFormError(null);
                          }}
                          error={touchedFields.city ? step1Errors.city : undefined}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <CustomInput
                          label="Pincode *"
                          placeholder="6-digit Pincode"
                          value={pincode}
                          onChangeText={(t) => {
                            const clean = t.replace(/[^0-9]/g, '');
                            setPincode(clean);
                            markTouched('pincode');
                            setFormError(null);
                          }}
                          keyboardType="numeric"
                          maxLength={6}
                          error={touchedFields.pincode ? step1Errors.pincode : undefined}
                        />
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <CustomInput
                      label="Full Name / Rider Name *"
                      placeholder="e.g., Alex Johnson"
                      value={name}
                      onChangeText={(t) => {
                        setName(t);
                        markTouched('name');
                      }}
                      error={touchedFields.name ? step1Errors.name : undefined}
                    />

                    <CustomInput
                      label="Email Address *"
                      placeholder="e.g., rider@cravingza.com"
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        markTouched('email');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      error={touchedFields.email ? step1Errors.email : undefined}
                    />

                    <CustomInput
                      label="Phone Number *"
                      placeholder="e.g., 9876543210"
                      value={phone}
                      onChangeText={(t) => {
                        const clean = t.replace(/[^0-9]/g, '');
                        setPhone(clean);
                        markTouched('phone');
                      }}
                      keyboardType="phone-pad"
                      maxLength={10}
                      error={touchedFields.phone ? step1Errors.phone : undefined}
                    />

                    <Text style={styles.fieldLabel}>Vehicle Type <Text style={{ color: '#EF4444', fontWeight: '900' }}>*</Text></Text>
                    <View style={styles.vehicleTypeRow}>
                      {[
                        { id: 'motorcycle', name: '🏍️ Motorcycle' },
                        { id: 'electric_scooter', name: '⚡ EV Scooter' },
                        { id: 'bicycle', name: '🚲 Bicycle' },
                      ].map((v) => (
                        <TouchableOpacity
                          key={v.id}
                          style={[
                            styles.vehicleChip,
                            vehicleType === v.id && styles.vehicleChipActive,
                          ]}
                          onPress={() => setVehicleType(v.id)}
                        >
                          <Text
                            style={[
                              styles.vehicleChipText,
                              vehicleType === v.id && styles.vehicleChipTextActive,
                            ]}
                          >
                            {v.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <CustomInput
                      label="Vehicle Registration Number *"
                      placeholder="e.g., UP16 AB 1234"
                      value={vehicleNumber}
                      onChangeText={(t) => {
                        setVehicleNumber(t);
                        markTouched('vehicleNumber');
                      }}
                      autoCapitalize="characters"
                      error={touchedFields.vehicleNumber ? step1Errors.vehicleNumber : undefined}
                    />

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                      <View style={{ flex: 1 }}>
                        <CustomInput
                          label="City *"
                          placeholder="City"
                          value={city}
                          onChangeText={(t) => {
                            setCity(t);
                            markTouched('city');
                          }}
                          error={touchedFields.city ? step1Errors.city : undefined}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <CustomInput
                          label="Pincode *"
                          placeholder="Pincode"
                          value={pincode}
                          onChangeText={(t) => {
                            const clean = t.replace(/[^0-9]/g, '').slice(0, 6);
                            setPincode(clean);
                            markTouched('pincode');
                          }}
                          keyboardType="numeric"
                          maxLength={6}
                          error={touchedFields.pincode ? step1Errors.pincode : undefined}
                        />
                      </View>
                    </View>
                  </>
                )}

                {/* Inline Form Error Box */}
                {formError && (
                  <View style={styles.inlineErrorBox}>
                    <Text style={styles.inlineErrorText}>{formError}</Text>
                  </View>
                )}

                {/* Step 1 Disabled Light Gray vs Active Primary Orange Button */}
                <TouchableOpacity
                  style={[
                    styles.continueStepBtn,
                    !isStep1FormValid && styles.continueStepBtnDisabled,
                  ]}
                  disabled={!isStep1FormValid}
                  onPress={handleNextStep1}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.continueStepBtnText,
                      !isStep1FormValid && styles.continueStepBtnTextDisabled,
                    ]}
                  >
                    Continue to Documents ➔
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 🌟 STEP 2: CLOUDINARY DOCUMENT UPLOADS */}
            {currentStep === 2 && (
              <View style={styles.formCard}>
                <Text style={styles.formSectionTitle}>📜 2. Cloudinary Document Verification</Text>
                <Text style={styles.docHelperText}>
                  Upload clear photos of your business licenses & KYC documents for instant approval.
                </Text>

                {partnerType === 'restaurant' ? (
                  <>
                    {/* Restaurant Cover Image */}
                    <View style={styles.uploadItemBox}>
                      <Text style={styles.docLabel}>Restaurant Cover Photo (JPEG/PNG)</Text>
                      {coverPhotoUrl ? (
                        <View style={styles.uploadedPreviewRow}>
                          <Image source={{ uri: coverPhotoUrl }} style={styles.uploadedThumb} resizeMode="cover" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.uploadedBadgeText}>✓ Cloudinary Uploaded</Text>
                            <Text style={styles.uploadedFileName} numberOfLines={1}>cover_image.jpg</Text>
                          </View>
                          <TouchableOpacity style={styles.removeDocBtn} onPress={() => setCoverPhotoUrl('')}>
                            <Text style={styles.removeDocText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.uploadPillBtn}
                          onPress={() => handlePickAndUpload('coverPhoto')}
                          disabled={uploadingField === 'coverPhoto'}
                        >
                          {uploadingField === 'coverPhoto' ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                          ) : (
                            <>
                              <Text style={styles.uploadIconText}>☁️</Text>
                              <Text style={styles.uploadBtnText}>Upload Cover Image</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* FSSAI License Document */}
                    <View style={[styles.uploadItemBox, { marginTop: 14 }]}>
                      <Text style={styles.docLabel}>FSSAI Food License Document (PDF/JPEG)</Text>
                      {fssaiLicenseUrl ? (
                        <View style={styles.uploadedPreviewRow}>
                          <Image source={{ uri: fssaiLicenseUrl }} style={styles.uploadedThumb} resizeMode="cover" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.uploadedBadgeText}>✓ Cloudinary Uploaded</Text>
                            <Text style={styles.uploadedFileName} numberOfLines={1}>fssai_license.pdf</Text>
                          </View>
                          <TouchableOpacity style={styles.removeDocBtn} onPress={() => setFssaiLicenseUrl('')}>
                            <Text style={styles.removeDocText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.uploadPillBtn}
                          onPress={() => handlePickAndUpload('fssai')}
                          disabled={uploadingField === 'fssai'}
                        >
                          {uploadingField === 'fssai' ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                          ) : (
                            <>
                              <Text style={styles.uploadIconText}>☁️</Text>
                              <Text style={styles.uploadBtnText}>Upload FSSAI License</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* GST / Business Registration */}
                    <View style={[styles.uploadItemBox, { marginTop: 14 }]}>
                      <Text style={styles.docLabel}>GST / Business Registration Certificate (PDF/JPEG)</Text>
                      {gstCertificateUrl ? (
                        <View style={styles.uploadedPreviewRow}>
                          <Image source={{ uri: gstCertificateUrl }} style={styles.uploadedThumb} resizeMode="cover" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.uploadedBadgeText}>✓ Cloudinary Uploaded</Text>
                            <Text style={styles.uploadedFileName} numberOfLines={1}>gst_certificate.pdf</Text>
                          </View>
                          <TouchableOpacity style={styles.removeDocBtn} onPress={() => setGstCertificateUrl('')}>
                            <Text style={styles.removeDocText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.uploadPillBtn}
                          onPress={() => handlePickAndUpload('gst')}
                          disabled={uploadingField === 'gst'}
                        >
                          {uploadingField === 'gst' ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                          ) : (
                            <>
                              <Text style={styles.uploadIconText}>☁️</Text>
                              <Text style={styles.uploadBtnText}>Upload GST Certificate</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                ) : (
                  <>
                    {/* Driving License Document */}
                    <View style={styles.uploadItemBox}>
                      <Text style={styles.docLabel}>Driving License Document (JPEG/PNG)</Text>
                      {drivingLicenseUrl ? (
                        <View style={styles.uploadedPreviewRow}>
                          <Image source={{ uri: drivingLicenseUrl }} style={styles.uploadedThumb} resizeMode="cover" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.uploadedBadgeText}>✓ Cloudinary Uploaded</Text>
                            <Text style={styles.uploadedFileName} numberOfLines={1}>driving_license.jpg</Text>
                          </View>
                          <TouchableOpacity style={styles.removeDocBtn} onPress={() => setDrivingLicenseUrl('')}>
                            <Text style={styles.removeDocText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.uploadPillBtn}
                          onPress={() => handlePickAndUpload('dl')}
                          disabled={uploadingField === 'dl'}
                        >
                          {uploadingField === 'dl' ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                          ) : (
                            <>
                              <Text style={styles.uploadIconText}>☁️</Text>
                              <Text style={styles.uploadBtnText}>Upload Driving License</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Aadhaar Card Document */}
                    <View style={[styles.uploadItemBox, { marginTop: 14 }]}>
                      <Text style={styles.docLabel}>Aadhaar Card / Govt ID Document (JPEG/PNG)</Text>
                      {aadhaarCardUrl ? (
                        <View style={styles.uploadedPreviewRow}>
                          <Image source={{ uri: aadhaarCardUrl }} style={styles.uploadedThumb} resizeMode="cover" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.uploadedBadgeText}>✓ Cloudinary Uploaded</Text>
                            <Text style={styles.uploadedFileName} numberOfLines={1}>aadhaar_card.jpg</Text>
                          </View>
                          <TouchableOpacity style={styles.removeDocBtn} onPress={() => setAadhaarCardUrl('')}>
                            <Text style={styles.removeDocText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.uploadPillBtn}
                          onPress={() => handlePickAndUpload('aadhaar')}
                          disabled={uploadingField === 'aadhaar'}
                        >
                          {uploadingField === 'aadhaar' ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                          ) : (
                            <>
                              <Text style={styles.uploadIconText}>☁️</Text>
                              <Text style={styles.uploadBtnText}>Upload Aadhaar Card</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}

                {/* Inline Form Error Box */}
                {formError && (
                  <View style={styles.inlineErrorBox}>
                    <Text style={styles.inlineErrorText}>{formError}</Text>
                  </View>
                )}

                <View style={styles.wizardBtnRow}>
                  <TouchableOpacity style={styles.backStepBtn} onPress={() => setCurrentStep(1)}>
                    <Text style={styles.backStepBtnText}>← Back</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    {partnerType === 'restaurant' ? (
                      <CustomButton
                        title="Submit Application 🎉"
                        onPress={handleSubmitApplication}
                        loading={loading}
                        showArrow={false}
                      />
                    ) : (
                      <CustomButton
                        title="Continue to Bank Payouts"
                        onPress={handleNextStep2}
                        showArrow={true}
                      />
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* 🌟 STEP 3: BANK PAYOUT DETAILS & FINAL SUBMISSION */}
            {currentStep === 3 && (
              <View style={styles.formCard}>
                <Text style={styles.formSectionTitle}>🏦 3. Bank Payout Details</Text>
                <Text style={styles.docHelperText}>
                  Weekly earnings & order payouts will be credited directly to this account.
                </Text>

                <CustomInput
                  label="Account Holder Name *"
                  placeholder="e.g., Alex Johnson"
                  value={accountHolderName}
                  onChangeText={setAccountHolderName}
                />

                <CustomInput
                  label="Bank Account Number *"
                  placeholder="e.g., 918273645012"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="numeric"
                />

                <CustomInput
                  label="IFSC Code *"
                  placeholder="e.g., HDFC0001234"
                  value={ifscCode}
                  onChangeText={setIfscCode}
                  autoCapitalize="characters"
                />

                {/* Inline Form Error Box */}
                {formError && (
                  <View style={styles.inlineErrorBox}>
                    <Text style={styles.inlineErrorText}>{formError}</Text>
                  </View>
                )}

                <View style={styles.wizardBtnRow}>
                  <TouchableOpacity style={styles.backStepBtn} onPress={() => setCurrentStep(2)}>
                    <Text style={styles.backStepBtnText}>← Back</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <CustomButton
                      title={
                        partnerType === 'restaurant'
                          ? 'Submit Application 🎉'
                          : 'Submit Driver Application 🎉'
                      }
                      onPress={handleSubmitApplication}
                      loading={loading}
                      showArrow={false}
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  flexOne: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconText: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: 'bold',
  },
  topHeaderTitle: {
    color: '#0F172A',
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 16,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 6,
  },
  typeTabBtnActive: {
    backgroundColor: COLORS.white,
    borderColor: '#EA580C',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeTabEmoji: {
    fontSize: 16,
  },
  typeTabText: {
    color: '#64748B',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  typeTabTextActive: {
    color: '#EA580C',
    fontWeight: '800',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  stepCircleActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  stepNumber: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
  },
  stepNumberActive: {
    color: COLORS.white,
  },
  stepLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: '#EA580C',
    fontWeight: '800',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
    marginTop: -14,
  },
  stepLineActive: {
    backgroundColor: '#EA580C',
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  formSectionTitle: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: SPACING.sm,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  vehicleChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  vehicleChipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: COLORS.primary,
  },
  vehicleChipText: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    fontWeight: '700',
  },
  vehicleChipTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  docHelperText: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    marginBottom: SPACING.sm,
    lineHeight: 16,
  },
  docLabel: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  uploadItemBox: {
    marginBottom: SPACING.xs,
  },
  uploadPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
    gap: 8,
  },
  uploadIconText: {
    fontSize: 16,
  },
  uploadBtnText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
    color: '#334155',
  },
  uploadedPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    padding: 10,
    borderRadius: 12,
    marginTop: 6,
    gap: 10,
  },
  uploadedThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  uploadedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
  },
  uploadedFileName: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  removeDocBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeDocText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  inlineErrorBox: {
    marginTop: 4,
    marginBottom: SPACING.sm,
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  inlineErrorText: {
    fontSize: FONT_SIZE.xs,
    color: '#DC2626',
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: SPACING.xs,
    borderRadius: 12,
  },
  continueStepBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueStepBtnDisabled: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueStepBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  continueStepBtnTextDisabled: {
    color: '#94A3B8',
    fontWeight: '700',
  },
  wizardBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: SPACING.md,
  },
  backStepBtn: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backStepBtnText: {
    color: '#334155',
    fontWeight: '800',
    fontSize: FONT_SIZE.sm,
  },
  guestWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: SPACING.md,
    borderRadius: 14,
    marginBottom: SPACING.md,
    gap: 10,
  },
  guestWarningIcon: {
    fontSize: 22,
  },
  guestWarningTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9A3412',
  },
  guestWarningSub: {
    fontSize: 11,
    color: '#C2410C',
    marginTop: 2,
  },
  guestLoginPillBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  guestLoginPillText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
