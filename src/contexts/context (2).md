### 1. Project Breakdown

**App Name:** DateCraft  
**Platform:** Mobile (iOS and Android)  
**Summary:** DateCraft is a mobile app designed to transform the dating experience by focusing on shared activities rather than superficial profile matching. Users propose creative date ideas, such as "sunset picnic" or "street food tour," and are matched with others who express interest in the same activities. The app integrates local partnerships to offer venue suggestions and discounts, enhancing the planning process. The goal is to foster meaningful connections through shared experiences, making first dates more engaging and less awkward.  

**Primary Use Case:**  
- A user creates a profile and suggests a date idea.  
- The app matches them with others who "like" the same activity.  
- Matched users chat to plan the details of their date, with optional venue suggestions and discounts from local partners.  

**Authentication Requirements:**  
- Email/password authentication for account creation and login.  
- Social login options (Google, Apple) for convenience.  
- Supabase Auth for secure user authentication and session management.  

---

### 2. Tech Stack Overview  
- **Frontend Framework:** React Native + Expo  
- **UI Library:** React Native Paper  
- **Backend (BaaS):** Supabase (data storage, real-time features)  
- **Deployment:** Expo + EAS (iOS/Android)  

---

### 3. Core Features  

1. **User Profiles:**  
   - Users can create profiles with basic information (name, age, bio, profile picture).  
   - Profiles include a section for listing preferred date activities.  

2. **Date Idea Suggestions:**  
   - Users can propose date ideas with a title, description, and optional location.  
   - Ideas are tagged with categories (e.g., "outdoor," "foodie," "cultural").  

3. **Activity Matching:**  
   - Users can browse and "like" date ideas proposed by others.  
   - Matches occur when two users "like" the same activity.  

4. **In-App Chat:**  
   - Real-time chat functionality for matched users to plan their date.  
   - Includes a shared calendar for scheduling.  

5. **Local Partnerships:**  
   - Integration with local venues to suggest locations and offer discounts.  
   - Users can view partner offers directly in the app.  

6. **Subscription Model:**  
   - Premium features include access to exclusive date ideas and priority matching.  
   - Subscription managed via in-app purchases (Expo RevenueCat integration).  

---

### 4. User Flow  

1. **Onboarding:**  
   - New users sign up via email/password or social login.  
   - Complete profile setup (name, age, bio, profile picture).  

2. **Propose or Browse Date Ideas:**  
   - Users can propose a new date idea or browse existing ones.  
   - Each idea displays a title, description, and category tags.  

3. **Like and Match:**  
   - Users "like" date ideas they are interested in.  
   - When two users "like" the same idea, they are matched.  

4. **Plan the Date:**  
   - Matched users access a private chat to discuss and plan their date.  
   - Optional venue suggestions and discounts from local partners are displayed.  

5. **Subscription Upsell:**  
   - Non-premium users are prompted to subscribe for exclusive features.  

---

### 5. Design and UI/UX Guidelines  

- **Color Palette:**  
  - Primary: #FF6B6B (warm coral for calls to action).  
  - Secondary: #4ECDC4 (soft teal for accents).  
  - Background: #F7FFF7 (light, neutral background).  

- **Typography:**  
  - Headings: Roboto Bold (clean and modern).  
  - Body Text: Roboto Regular (readable and approachable).  

- **UI Components:**  
  - Use React Native Paper components for consistency (e.g., Cards for date ideas, Buttons for actions).  
  - Implement a bottom navigation bar for easy access to key sections (Profile, Explore, Chat).  

- **Animations:**  
  - Subtle animations for transitions (e.g., fade-in for new matches).  
  - Use React Native Reanimated for smooth, performant animations.  

- **Accessibility:**  
  - Ensure all text meets WCAG contrast ratios.  
  - Provide alt text for images and labels for interactive elements.  

---

### 6. Technical Implementation  

1. **Frontend (React Native + Expo):**  
   - Use Expo for rapid development and testing.  
   - Implement navigation using React Navigation (Stack and Bottom Tabs).  
   - Use React Native Paper for pre-styled components (e.g., Cards, Buttons).  

2. **Backend (Supabase):**  
   - Store user profiles, date ideas, and matches in Supabase tables.  
   - Use Supabase Auth for secure authentication.  
   - Enable real-time updates for chat and match notifications using Supabase Realtime.  

3. **Chat Implementation:**  
   - Use Supabase Realtime to power the in-app chat.  
   - Store chat messages in a Supabase table and listen for updates in real time.  

4. **Local Partnerships:**  
   - Store partner offers in a Supabase table.  
   - Display offers in the app using a carousel component (React Native Snap Carousel).  

5. **Subscription Management:**  
   - Integrate Expo RevenueCat for subscription handling.  
   - Use Supabase to store subscription status and grant access to premium features.  

6. **Deployment:**  
   - Use Expo EAS for building and deploying to iOS and Android.  
   - Configure OTA updates for seamless feature rollouts.  

---

### 7. Development Tools and Setup  

1. **Required Tools:**  
   - Node.js (v18+).  
   - Expo CLI (latest version).  
   - Supabase CLI for local development.  
   - Xcode (for iOS development).  
   - Android Studio (for Android development).  

2. **Setup Instructions:**  
   - Install Node.js and Expo CLI globally.  
   - Create a new Expo project: `expo init DateCraft`.  
   - Install dependencies:  
     ```bash  
     npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs react-native-paper @supabase/supabase-js react-native-reanimated react-native-snap-carousel  
     ```  
   - Set up Supabase:  
     - Create a Supabase project and enable Auth, Realtime, and Storage.  
     - Add Supabase credentials to the app's environment variables.  
   - Configure Expo EAS for deployment:  
     ```bash  
     eas build:configure  
     eas build --platform all  
     ```  

This blueprint provides a comprehensive roadmap for developing DateCraft using the specified tech stack, ensuring a seamless and engaging user experience.