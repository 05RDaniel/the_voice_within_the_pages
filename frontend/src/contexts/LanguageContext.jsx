import { createContext, useState, useContext, useEffect } from 'react';

const translations = {
  es: {
    // Header
    archive: 'Archivo',
    scriptorium: 'Scriptorium',
    myProfile: 'Mi perfil',
    logout: 'Cerrar sesión',
    lightMode: 'Modo claro',
    darkMode: 'Modo oscuro',
    home: 'Inicio',
    
    // Login
    loginTitle: '📜 La Voz de las Páginas',
    loginSubtitle: 'Inicia sesión para continuar tu aventura',
    usernameOrEmail: 'Usuario o Email',
    password: 'Contraseña',
    loginButton: 'Iniciar Sesión',
    loggingIn: 'Iniciando sesión...',
    noAccount: '¿No tienes cuenta?',
    registerHere: 'Regístrate aquí',
    loginError: 'Error al iniciar sesión. Por favor, intenta de nuevo.',
    invalidCredentials: 'Credenciales inválidas',
    
    // Register
    registerTitle: '📜 Registro',
    registerSubtitle: 'Crea tu cuenta para empezar a escribir',
    username: 'Nombre de Usuario',
    email: 'Email',
    confirmPassword: 'Confirmar Contraseña',
    registerButton: 'Registrarse',
    registering: 'Registrando...',
    hasAccount: '¿Ya tienes cuenta?',
    loginHere: 'Inicia sesión aquí',
    usernameHint: 'Entre 3 y 20 caracteres, solo letras, números, guiones y guiones bajos.',
    passwordsNoMatch: 'Las contraseñas no coinciden.',
    registerError: 'Error al registrar usuario. Por favor, intenta de nuevo.',
    emailAlreadyExists: 'El email ya está registrado',
    usernameAlreadyExists: 'El nombre de usuario ya está en uso',
    invalidEmailFormat: 'El formato del email no es válido',
    invalidUsernameFormat: 'El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede contener letras, números, guiones y guiones bajos',
    allFieldsRequired: 'Todos los campos son requeridos',
    
    // Home
    welcomeTitle: 'Bienvenido a La Voz de las Páginas.',
    welcomeP1: 'Aquí, donde la imaginación deja de ser un susurro y se convierte en palabra escrita, nacen los mundos que aún no existen y respiran los personajes que esperan ser recordados. Este no es solo un lugar para contar historias: es un refugio para narradores, un taller para arquitectos de tramas, un archivo vivo donde cada idea encuentra forma, orden y propósito.',
    welcomeP2: 'En La Voz de las Páginas, tus relatos no existen en soledad. Este es un espacio concebido para que tus ideas encuentren forma, profundidad y coherencia, permitiéndote desarrollar historias que respiran y evolucionan con naturalidad. Ya escribas fantasía, ciencia ficción, drama o crónicas de mundos imposibles, aquí tus narraciones crecen, se consolidan y se preparan para ser compartidas con otros, dentro de un universo que respeta y potencia tu visión creativa.',
    welcomeP3: 'Cruza el umbral. Escribe. Construye. Da voz a las páginas.',
    
    // Profile
    profileTitle: 'Mi Perfil',
    memberSince: 'Miembro desde',
    profileImage: 'Imagen de perfil',
    changeProfileImage: 'Cambiar imagen de perfil',
    clickToChangeImage: 'Haz clic para cambiar la imagen',
    invalidImageType: 'Tipo de archivo no válido. Solo se permiten imágenes.',
    imageTooLarge: 'La imagen es demasiado grande (máximo 2MB)',
    uploadError: 'Error al subir la imagen',
    
    // Change Password
    changePassword: 'Cambiar Contraseña',
    currentPassword: 'Contraseña Actual',
    newPassword: 'Nueva Contraseña',
    confirmNewPassword: 'Confirmar Nueva Contraseña',
    passwordChanged: 'Contraseña actualizada exitosamente',
    passwordChangeError: 'Error al cambiar la contraseña',
    currentPasswordIncorrect: 'La contraseña actual es incorrecta',
    newPasswordsDontMatch: 'Las contraseñas nuevas no coinciden',
    samePasswordError: 'La nueva contraseña debe ser diferente a la actual',
    
    // Scriptorium
    scriptoriumWelcome: 'Bienvenido al Scriptorium',
    stories: 'Historias',
    storiesDescription: 'Crea y gestiona tus relatos. Desde cuentos cortos hasta sagas épicas, organiza todas tus narraciones en un solo lugar.',
    characters: 'Personajes',
    charactersDescription: 'Da vida a tus protagonistas y antagonistas. Define sus rasgos, motivaciones y arcos de desarrollo.',
    plots: 'Tramas',
    plotsDescription: 'Diseña las estructuras narrativas de tus historias. Organiza los eventos, giros y desenlaces.',
    
    // Plots/Timelines Page
    timelines: 'Líneas Temporales',
    plot: 'trama',
    errorLoadingTimelines: 'Error al cargar las líneas temporales',
    noTimelinesYet: 'Aún no tienes líneas temporales',
    createStoryForTimeline: 'Crea una historia para generar una línea temporal',
    errorLoadingTimeline: 'Error al cargar la línea temporal',
    timelineNotFound: 'Línea temporal no encontrada',
    backToTimelines: 'Volver a líneas temporales',
    noPlotsYet: 'Aún no hay tramas',
    addPlotsToTimeline: 'Añade tramas a esta línea temporal',
    chapter: 'Cap.',
    
    // Stories Page
    myStories: 'Mis Historias',
    newStory: 'Nueva Historia',
    createNewStory: 'Crear Nueva Historia',
    storyTitle: 'Título',
    storyTitlePlaceholder: 'El título de tu historia...',
    storyContent: 'Contenido',
    storyContentPlaceholder: 'Escribe tu historia aquí...',
    visibility: 'Visibilidad',
    public: 'Público',
    private: 'Privado',
    unlisted: 'No listado',
    create: 'Crear',
    noStoriesYet: 'Aún no tienes historias',
    createFirstStory: 'Crea tu primera historia y comienza a escribir',
    errorLoadingStories: 'Error al cargar las historias',
    errorCreatingStory: 'Error al crear la historia',
    errorDeletingStory: 'Error al eliminar la historia',
    confirmDelete: '¿Eliminar historia?',
    deleteStoryWarning: 'Esta acción no se puede deshacer. Se eliminará permanentemente:',
    delete: 'Eliminar',
    
    // Story Editor
    errorLoadingStory: 'Error al cargar la historia',
    errorSavingStory: 'Error al guardar la historia',
    backToStories: 'Volver a historias',
    saving: 'Guardando...',
    saved: 'Guardado',
    unsaved: 'Sin guardar',
    untitledStory: 'Historia sin título',
    settings: 'Configuración',
    startWriting: 'Comienza a escribir tu historia...',
    words: 'palabras',
    chars: 'caracteres',
    save: 'Guardar',
    
    // Formatting Toolbar
    paragraph: 'Párrafo',
    heading: 'Título',
    bold: 'Negrita',
    italic: 'Cursiva',
    underline: 'Subrayado',
    strikethrough: 'Tachado',
    bulletList: 'Lista con viñetas',
    numberedList: 'Lista numerada',
    quote: 'Cita',
    alignLeft: 'Alinear a la izquierda',
    alignCenter: 'Centrar',
    alignRight: 'Alinear a la derecha',
    alignJustify: 'Justificar',
    
    // Common
    loading: 'Cargando...',
    back: 'Volver',
    cancel: 'Cancelar',
  },
  en: {
    // Header
    archive: 'Archive',
    scriptorium: 'Scriptorium',
    myProfile: 'My Profile',
    logout: 'Log out',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    home: 'Home',
    
    // Login
    loginTitle: '📜 The Voice of Pages',
    loginSubtitle: 'Log in to continue your adventure',
    usernameOrEmail: 'Username or Email',
    password: 'Password',
    loginButton: 'Log In',
    loggingIn: 'Logging in...',
    noAccount: "Don't have an account?",
    registerHere: 'Register here',
    loginError: 'Login error. Please try again.',
    invalidCredentials: 'Invalid credentials',
    
    // Register
    registerTitle: '📜 Register',
    registerSubtitle: 'Create your account to start writing',
    username: 'Username',
    email: 'Email',
    confirmPassword: 'Confirm Password',
    registerButton: 'Register',
    registering: 'Registering...',
    hasAccount: 'Already have an account?',
    loginHere: 'Log in here',
    usernameHint: 'Between 3 and 20 characters, only letters, numbers, hyphens and underscores.',
    passwordsNoMatch: 'Passwords do not match.',
    registerError: 'Registration error. Please try again.',
    emailAlreadyExists: 'Email is already registered',
    usernameAlreadyExists: 'Username is already taken',
    invalidEmailFormat: 'Invalid email format',
    invalidUsernameFormat: 'Username must be between 3 and 20 characters and can only contain letters, numbers, hyphens and underscores',
    allFieldsRequired: 'All fields are required',
    
    // Home
    welcomeTitle: 'Welcome to The Voice of Pages.',
    welcomeP1: 'Here, where imagination ceases to be a whisper and becomes written word, worlds that do not yet exist are born and characters who await to be remembered breathe. This is not just a place to tell stories: it is a refuge for storytellers, a workshop for plot architects, a living archive where every idea finds form, order, and purpose.',
    welcomeP2: 'In The Voice of Pages, your stories do not exist in solitude. This is a space designed for your ideas to find form, depth, and coherence, allowing you to develop stories that breathe and evolve naturally. Whether you write fantasy, science fiction, drama, or chronicles of impossible worlds, here your narratives grow, consolidate, and prepare to be shared with others, within a universe that respects and enhances your creative vision.',
    welcomeP3: 'Cross the threshold. Write. Build. Give voice to the pages.',
    
    // Profile
    profileTitle: 'My Profile',
    memberSince: 'Member since',
    profileImage: 'Profile image',
    changeProfileImage: 'Change profile image',
    clickToChangeImage: 'Click to change image',
    invalidImageType: 'Invalid file type. Only images are allowed.',
    imageTooLarge: 'Image is too large (max 2MB)',
    uploadError: 'Error uploading image',
    
    // Change Password
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    passwordChanged: 'Password updated successfully',
    passwordChangeError: 'Error changing password',
    currentPasswordIncorrect: 'Current password is incorrect',
    newPasswordsDontMatch: 'New passwords do not match',
    samePasswordError: 'New password must be different from current',
    
    // Scriptorium
    scriptoriumWelcome: 'Welcome to the Scriptorium',
    stories: 'Stories',
    storiesDescription: 'Create and manage your tales. From short stories to epic sagas, organize all your narratives in one place.',
    characters: 'Characters',
    charactersDescription: 'Bring your protagonists and antagonists to life. Define their traits, motivations, and development arcs.',
    plots: 'Plots',
    plotsDescription: 'Design the narrative structures of your stories. Organize events, twists, and endings.',
    
    // Plots/Timelines Page
    timelines: 'Timelines',
    plot: 'plot',
    errorLoadingTimelines: 'Error loading timelines',
    noTimelinesYet: "You don't have any timelines yet",
    createStoryForTimeline: 'Create a story to generate a timeline',
    errorLoadingTimeline: 'Error loading timeline',
    timelineNotFound: 'Timeline not found',
    backToTimelines: 'Back to timelines',
    noPlotsYet: 'No plots yet',
    addPlotsToTimeline: 'Add plots to this timeline',
    chapter: 'Ch.',
    
    // Stories Page
    myStories: 'My Stories',
    newStory: 'New Story',
    createNewStory: 'Create New Story',
    storyTitle: 'Title',
    storyTitlePlaceholder: 'Your story title...',
    storyContent: 'Content',
    storyContentPlaceholder: 'Write your story here...',
    visibility: 'Visibility',
    public: 'Public',
    private: 'Private',
    unlisted: 'Unlisted',
    create: 'Create',
    noStoriesYet: "You don't have any stories yet",
    createFirstStory: 'Create your first story and start writing',
    errorLoadingStories: 'Error loading stories',
    errorCreatingStory: 'Error creating story',
    errorDeletingStory: 'Error deleting story',
    confirmDelete: 'Delete story?',
    deleteStoryWarning: 'This action cannot be undone. The following will be permanently deleted:',
    delete: 'Delete',
    
    // Story Editor
    errorLoadingStory: 'Error loading story',
    errorSavingStory: 'Error saving story',
    backToStories: 'Back to stories',
    saving: 'Saving...',
    saved: 'Saved',
    unsaved: 'Unsaved',
    untitledStory: 'Untitled story',
    settings: 'Settings',
    startWriting: 'Start writing your story...',
    words: 'words',
    chars: 'characters',
    save: 'Save',
    
    // Formatting Toolbar
    paragraph: 'Paragraph',
    heading: 'Heading',
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    strikethrough: 'Strikethrough',
    bulletList: 'Bullet list',
    numberedList: 'Numbered list',
    quote: 'Quote',
    alignLeft: 'Align left',
    alignCenter: 'Center',
    alignRight: 'Align right',
    alignJustify: 'Justify',
    
    // Common
    loading: 'Loading...',
    back: 'Back',
    cancel: 'Cancel',
  }
};

const LanguageContext = createContext(null);

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'es';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'es' ? 'en' : 'es');
  };

  const t = (key) => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

