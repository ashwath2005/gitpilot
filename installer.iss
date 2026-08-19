; GitPilot Inno Setup Script
#define MyAppName "GitPilot"
#define MyAppVersion "1.2.0"
#define MyAppPublisher "GitPilot Team"
#define MyAppURL "https://github.com/ashwath2005/GitPilot"
#define MyAppExeName "GitPilot.exe"

[Setup]
AppId={{E1F86742-998C-4B9E-A79B-89E2849F3011}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
OutputDir=D:\GitPilot\dist-installer
OutputBaseFilename=GitPilot-Setup-v1.2.0
SetupIconFile=D:\GitPilot\src-tauri\icons\icon.ico
UninstallDisplayIcon={app}\app.ico
Compression=lzma2/fast
SolidCompression=no
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=lowest

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "D:\GitPilot\dist-app\GitPilot-win32-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "D:\GitPilot\src-tauri\icons\icon.ico"; DestDir: "{app}"; DestName: "app.ico"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon; IconFilename: "{app}\app.ico"

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
