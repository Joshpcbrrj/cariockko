#define AppName "Cariockko"
#define AppVersion "0.2.0"
#define AppPublisher "Cariockko"
#define AppExeName "powershell.exe"

[Setup]
AppId={{8EAF7654-BEF0-4F72-9D30-6A0C2A3D1301}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName={localappdata}\Programs\Cariockko
DefaultGroupName={#AppName}
OutputDir=output
OutputBaseFilename=Cariockko-Setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na área de trabalho"; GroupDescription: "Atalhos:"

[Files]
Source: "..\.env.example"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\docker-compose.yml"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\Makefile"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\db\*"; DestDir: "{app}\db"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\api\*"; DestDir: "{app}\api"; Excludes: "*.env,*.env.local,node_modules\*,dist\*"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\web\*"; DestDir: "{app}\web"; Excludes: "*.env,*.env.local,node_modules\*,.next\*,out\*"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\scripts\install-windows.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion
Source: "..\README.md"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Iniciar Cariockko"; Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\install-windows.ps1"""; WorkingDir: "{app}"
Name: "{autodesktop}\Cariockko"; Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\install-windows.ps1"""; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\install-windows.ps1"""; WorkingDir: "{app}"; Description: "Iniciar Cariockko"; Flags: postinstall nowait skipifsilent

[UninstallRun]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -Command ""Set-Location '{app}'; docker compose down"""; WorkingDir: "{app}"; Flags: runhidden; RunOnceId: "StopCariockkoStack"
