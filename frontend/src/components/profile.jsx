import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "./profile.css";

const SKILLS = [
  "React", "JavaScript", "Python", "Web Design", "Data Analysis",
  "Guitar", "Piano", "Singing", "Music Production", "DJ",
  "Hip Hop", "Ballet", "Contemporary", "Salsa", "Leadership",
  "Communication", "Time Management", "Problem Solving",
  "Teamwork", "Public Speaking", "Other",
];

const LEARNING_INTERESTS = [...SKILLS];

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser, fetchCurrentUser } = useUser();
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    profilePicture: "",
    skills: [],
    customSkill: "",
    wantToLearn: [],
    customLearning: "",
  });
  const [showCustomSkill, setShowCustomSkill] = useState(false);
  const [showCustomLearning, setShowCustomLearning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const completion = Math.min(100, Math.round(user?.profileCompletion || 0));
  const isVerified = Boolean(user?.verified);
  const verificationBadge = user?.verificationBadge || null;

  // Load existing user data when component mounts
  useEffect(() => {
    if (user) {
      setIsEditing(true);
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        dob: user.dob || "",
        gender: user.gender || "",
        profilePicture: user.profilePicture || "",
        skills: user.skills || [],
        customSkill: "",
        wantToLearn: user.learningGoals || [],
        customLearning: "",
      });
    } else {
      // Fetch user data if not available
      fetchCurrentUser().then(() => {
        // This will trigger the useEffect again when user is loaded
      });
    }
  }, [user, fetchCurrentUser]);

  const handleSkillChange = (e) => {
    const value = e.target.value;
    if (value === "Other") {
      setShowCustomSkill(true);
    } else if (!profileData.skills.includes(value)) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, value],
      });
    }
  };

  const addCustomSkill = () => {
    if (profileData.customSkill.trim()) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, profileData.customSkill.trim()],
        customSkill: "",
      });
      setShowCustomSkill(false);
    }
  };

  const removeSkill = (skillToRemove) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  const handleLearningChange = (e) => {
    const value = e.target.value;
    if (value === "Other") {
      setShowCustomLearning(true);
    } else if (!profileData.wantToLearn.includes(value)) {
      setProfileData({
        ...profileData,
        wantToLearn: [...profileData.wantToLearn, value],
      });
    }
  };

  const addCustomLearning = () => {
    if (profileData.customLearning.trim()) {
      setProfileData({
        ...profileData,
        wantToLearn: [...profileData.wantToLearn, profileData.customLearning.trim()],
        customLearning: "",
      });
      setShowCustomLearning(false);
    }
  };

  const removeLearning = (learningToRemove) => {
    setProfileData({
      ...profileData,
      wantToLearn: profileData.wantToLearn.filter((item) => item !== learningToRemove),
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB. Please choose a smaller image.');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({
          ...profileData,
          profilePicture: reader.result,
        });
      };
      reader.onerror = () => {
        alert('Error reading image file. Please try again.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please log in to save your profile');
      navigate('/login');
      return;
    }

    try {
      // Map wantToLearn to learningGoals for backend
      const profileUpdate = {
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        dob: profileData.dob || "",
        gender: profileData.gender || "",
        profilePicture: profileData.profilePicture || "",
        skills: profileData.skills || [],
        learningGoals: profileData.wantToLearn || [],
      };

      // Check if profile picture is too large (base64 can be very large)
      // Base64 encoding increases size by ~33%, so 2MB file becomes ~2.6MB base64
      if (profileUpdate.profilePicture && profileUpdate.profilePicture.length > 3000000) {
        alert('Profile picture is too large. Please use a smaller image (under 2MB file size).');
        return;
      }

      console.log('Sending profile update:', {
        ...profileUpdate,
        profilePicture: profileUpdate.profilePicture ? `${profileUpdate.profilePicture.substring(0, 50)}...` : 'none'
      });

      const response = await fetch('http://localhost:5000/api/auth/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileUpdate),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // Handle cases where response might not be JSON
          if (response.status === 413) {
            errorData = { message: 'Profile picture is too large. Please use a smaller image (under 2MB).' };
          } else {
            errorData = { message: `Server error (Status: ${response.status}). Please try again.` };
          }
        }
        console.error('Profile update error response:', errorData);
        alert(errorData.message || `Failed to save profile. Status: ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log('Profile update success:', data);

      if (!data.user) {
        alert('Profile updated but no user data returned. Please refresh the page.');
        return;
      }

      // Update user context with new data
      updateUser(data.user);
      // Refresh user data from backend
      await fetchCurrentUser();
      
      // Show success message
      alert('Profile updated successfully!');
      navigate("/student-dashboard");
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(`Error saving profile: ${error.message || 'Please check your connection and try again.'}`);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div>
                <h1 className="profile-title">
                  {isEditing ? "My Profile" : "Complete Your Profile"}
                </h1>
                <p className="profile-subtitle">
                  {isEditing 
                    ? "Update your profile information" 
                    : "Tell us more about yourself to get started"}
                </p>
              </div>
            </div>
            {user && (
              <div
                className={`verification-banner ${isVerified ? "verified" : "pending"}`}
              >
                <div className="verification-meta">
                  <span className="verification-status">
                    {isVerified
                      ? "Your profile is verified"
                      : "Complete the checklist to get verified"}
                  </span>
                  <span className="verification-progress">
                    Profile completeness: {completion}%
                  </span>
                  <div className="verification-progress-bar">
                    <span style={{ width: `${completion}%` }} />
                  </div>
                </div>
                <div className="verification-actions">
                  {verificationBadge ? (
                    <span className="verification-badge">{verificationBadge}</span>
                  ) : (
                    <span className="verification-next-step">
                      Add a photo, skills and learning goals to unlock mentorships.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            {/* Profile Picture */}
            <div className="profile-avatar-section">
              <div className="profile-avatar-wrapper">
                {profileData.profilePicture ? (
                  <img
                    src={profileData.profilePicture}
                    alt="Profile"
                    className="profile-avatar"
                  />
                ) : (
                  <div className="profile-avatar-fallback">
                    {profileData.firstName?.[0] || "U"}
                  </div>
                )}
                <label htmlFor="profile-picture" className="profile-avatar-upload">
                  Upload
                  <input
                    id="profile-picture"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>

            {/* Name Fields */}
            <div className="profile-name-grid">
              <div className="profile-field">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={profileData.firstName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, firstName: e.target.value })
                  }
                  required
                  className="profile-input"
                />
              </div>
              <div className="profile-field">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={profileData.lastName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, lastName: e.target.value })
                  }
                  required
                  className="profile-input"
                />
              </div>
            </div>

            {/* DOB */}
            <div className="profile-field">
              <label htmlFor="dob">Date of Birth</label>
              <input
                id="dob"
                type="date"
                value={profileData.dob}
                onChange={(e) =>
                  setProfileData({ ...profileData, dob: e.target.value })
                }
                required
                className="profile-input"
              />
            </div>

            {/* Gender */}
            <div className="profile-field">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                value={profileData.gender}
                onChange={(e) =>
                  setProfileData({ ...profileData, gender: e.target.value })
                }
                className="profile-input"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            {/* Skills */}
            <div className="profile-field">
              <label htmlFor="skills">Skills</label>
              <select id="skills" onChange={handleSkillChange} className="profile-input">
                <option value="">Select your skills</option>
                {SKILLS.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>

              {showCustomSkill && (
                <div className="profile-custom-input">
                  <input
                    placeholder="Enter your skill"
                    value={profileData.customSkill}
                    onChange={(e) =>
                      setProfileData({ ...profileData, customSkill: e.target.value })
                    }
                    className="profile-input"
                  />
                  <button type="button" onClick={addCustomSkill}>
                    Add
                  </button>
                </div>
              )}

              {profileData.skills.length > 0 && (
                <div className="profile-tags">
                  {profileData.skills.map((skill, index) => (
                    <span key={index} className="profile-tag profile-tag-skill">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="profile-tag-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Learning Interests */}
            <div className="profile-field">
              <label htmlFor="wantToLearn">What do you want to learn?</label>
              <select
                id="wantToLearn"
                onChange={handleLearningChange}
                className="profile-input"
              >
                <option value="">Select what you want to learn</option>
                {LEARNING_INTERESTS.map((interest) => (
                  <option key={interest} value={interest}>
                    {interest}
                  </option>
                ))}
              </select>

              {showCustomLearning && (
                <div className="profile-custom-input">
                  <input
                    placeholder="Enter what you want to learn"
                    value={profileData.customLearning}
                    onChange={(e) =>
                      setProfileData({ ...profileData, customLearning: e.target.value })
                    }
                    className="profile-input"
                  />
                  <button type="button" onClick={addCustomLearning}>
                    Add
                  </button>
                </div>
              )}

              {profileData.wantToLearn.length > 0 && (
                <div className="profile-tags">
                  {profileData.wantToLearn.map((learning, index) => (
                    <span key={index} className="profile-tag profile-tag-learning">
                      {learning}
                      <button
                        type="button"
                        onClick={() => removeLearning(learning)}
                        className="profile-tag-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="profile-submit-btn">
              {isEditing ? "Update Profile" : "Complete Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
