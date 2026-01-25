/**
 * Expo Config Plugin per aggiungere MediaPipe durante prebuild
 *
 * Questo plugin:
 * - Copia i file MediaPipe Kotlin/Swift da native-modules/
 * - Aggiunge la dipendenza MediaPipe ai build files
 * - Modifica MainApplication.kt per registrare il plugin
 * - Configura iOS con Podfile e pbxproj
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Genera un UUID compatibile con Xcode (24 caratteri hex)
 */
function generateUUID() {
  return 'XXXXXXXXXXXXXXXXXXXXXXXX'.replace(/X/g, () =>
    Math.floor(Math.random() * 16).toString(16).toUpperCase()
  );
}

const withMediaPipePreserve = (config) => {
  // ============================================
  // ANDROID HOOK
  // ============================================
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidPackage = config.android?.package || 'com.pusho';
      const packagePath = androidPackage.replace(/\./g, '/');

      console.log('🤖 [Android] Configurazione MediaPipe...');
      console.log(`   Package: ${androidPackage}`);

      // Percorsi
      const nativeModulesDir = path.join(projectRoot, 'native-modules', 'android', 'mediapipe');
      const destDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', packagePath, 'mediapipe');
      const assetsDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'assets');
      const buildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');
      const mainApplicationPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', packagePath, 'MainApplication.kt');

      // 1. Copia file MediaPipe Kotlin
      if (fs.existsSync(nativeModulesDir)) {
        fs.mkdirSync(destDir, { recursive: true });

        const files = fs.readdirSync(nativeModulesDir);
        for (const file of files) {
          if (file.endsWith('.kt')) {
            const srcFile = path.join(nativeModulesDir, file);
            const destFile = path.join(destDir, file);

            // Leggi, sostituisci placeholder package, scrivi
            let content = fs.readFileSync(srcFile, 'utf8');
            content = content.replace(/\{\{PACKAGE_NAME\}\}/g, androidPackage);
            fs.writeFileSync(destFile, content);

            console.log(`   ✅ Copiato: ${file}`);
          }
        }
      } else {
        console.error(`   ❌ native-modules/android/mediapipe non trovata`);
        return config;
      }

      // 2. Copia modello MediaPipe negli assets
      const modelSrcPaths = [
        path.join(projectRoot, 'native-modules', 'android', 'pose_landmarker_full.task'),
        path.join(projectRoot, 'src', 'models', 'pose_landmarker_full.task'),
        path.join(projectRoot, 'assets', 'pose_landmarker_full.task'),
      ];

      fs.mkdirSync(assetsDir, { recursive: true });
      const modelDestPath = path.join(assetsDir, 'pose_landmarker_full.task');

      let modelCopied = false;
      for (const modelSrc of modelSrcPaths) {
        if (fs.existsSync(modelSrc)) {
          fs.copyFileSync(modelSrc, modelDestPath);
          console.log(`   ✅ Modello copiato da: ${path.relative(projectRoot, modelSrc)}`);
          modelCopied = true;
          break;
        }
      }

      if (!modelCopied) {
        console.warn('   ⚠️ Modello pose_landmarker_full.task non trovato. Esegui: npm run download-model');
      }

      // 3. Aggiungi dipendenza MediaPipe a build.gradle
      if (fs.existsSync(buildGradlePath)) {
        let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

        if (!buildGradle.includes('com.google.mediapipe:tasks-vision')) {
          // Trova la sezione dependencies e aggiungi MediaPipe
          const dependenciesRegex = /(dependencies\s*\{[\s\S]*?)(^\})/m;
          const match = buildGradle.match(dependenciesRegex);

          if (match) {
            // Aggiungi prima della chiusura }
            const mediapipeDep = `\n    // MediaPipe Tasks Vision - per pose detection realtime\n    implementation 'com.google.mediapipe:tasks-vision:0.10.14'\n`;
            buildGradle = buildGradle.replace(
              dependenciesRegex,
              `$1${mediapipeDep}$2`
            );
            fs.writeFileSync(buildGradlePath, buildGradle);
            console.log('   ✅ Dipendenza MediaPipe aggiunta a build.gradle');
          }
        } else {
          console.log('   ℹ️ Dipendenza MediaPipe già presente in build.gradle');
        }
      }

      // 4. Modifica MainApplication.kt per registrare MediaPipe
      if (fs.existsSync(mainApplicationPath)) {
        let mainApp = fs.readFileSync(mainApplicationPath, 'utf8');

        // Aggiungi import se non presente
        const mediapipeImport = `import ${androidPackage}.mediapipe.MediaPipePosePackage`;
        const detectPoseImport = `import ${androidPackage}.mediapipe.DetectPosePlugin`;
        const frameProcessorImport = `import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry`;

        if (!mainApp.includes('MediaPipePosePackage')) {
          // Aggiungi import dopo gli altri import
          const importInsertPoint = mainApp.lastIndexOf('import ');
          const endOfImportLine = mainApp.indexOf('\n', importInsertPoint);

          const imports = `\n${mediapipeImport}\n${detectPoseImport}\n${frameProcessorImport}`;
          mainApp = mainApp.slice(0, endOfImportLine + 1) + imports + mainApp.slice(endOfImportLine + 1);

          // Aggiungi MediaPipePosePackage() alla lista packages
          if (mainApp.includes('PackageList(this).packages')) {
            // Cerca il pattern .apply { ... } o simile
            if (mainApp.includes('.packages.apply')) {
              // Già ha .apply, aggiungi dentro
              mainApp = mainApp.replace(
                /\.packages\.apply\s*\{/,
                `.packages.apply {\n              add(MediaPipePosePackage())`
              );
            } else {
              // Aggiungi .apply { }
              mainApp = mainApp.replace(
                /PackageList\(this\)\.packages/,
                `PackageList(this).packages.apply {\n              add(MediaPipePosePackage())\n            }`
              );
            }
          }

          // Registra Frame Processor Plugin in onCreate
          const frameProcessorRegistration = `
    // Registra il Frame Processor Plugin per MediaPipe
    FrameProcessorPluginRegistry.addFrameProcessorPlugin("detectPose") { proxy, options ->
      DetectPosePlugin(proxy, options)
    }
`;

          if (!mainApp.includes('FrameProcessorPluginRegistry.addFrameProcessorPlugin')) {
            // Aggiungi dopo super.onCreate() in onCreate
            mainApp = mainApp.replace(
              /(override fun onCreate\(\)\s*\{[\s\S]*?super\.onCreate\(\))/,
              `$1\n${frameProcessorRegistration}`
            );
          }

          fs.writeFileSync(mainApplicationPath, mainApp);
          console.log('   ✅ MainApplication.kt modificato');
        } else {
          console.log('   ℹ️ MainApplication.kt già configurato');
        }
      } else {
        console.warn(`   ⚠️ MainApplication.kt non trovato: ${mainApplicationPath}`);
      }

      console.log('🤖 [Android] Configurazione completata');

      return config;
    },
  ]);

  // ============================================
  // iOS HOOK
  // ============================================
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const projectName = config.modRequest.projectName || 'Pusho';

      // IMPORTANTE: I file sorgente sono in native-modules/ios/ (fuori dalla cartella ios che viene cancellata)
      const nativeModulesDir = path.join(projectRoot, 'native-modules', 'ios');
      const mediapipeSrcDir = path.join(nativeModulesDir, 'MediaPipe');
      const modelSrcPath = path.join(nativeModulesDir, 'pose_landmarker_full.task');
      const modelSrcPathAndroid = path.join(projectRoot, 'native-modules', 'android', 'pose_landmarker_full.task');

      // Destinazione: dove Expo genera il progetto
      const iosDir = path.join(projectRoot, 'ios');
      const iosGeneratedDir = path.join(iosDir, projectName);
      const mediapipeDestDir = path.join(iosGeneratedDir, 'MediaPipe');

      console.log('📱 [iOS] Configurazione MediaPipe...');
      console.log(`   Source dir: ${mediapipeSrcDir}`);
      console.log(`   Dest dir: ${mediapipeDestDir}`);

      // Copia cartella MediaPipe da native-modules
      if (fs.existsSync(mediapipeSrcDir)) {
        fs.mkdirSync(mediapipeDestDir, { recursive: true });

        const files = fs.readdirSync(mediapipeSrcDir);
        for (const file of files) {
          const srcFile = path.join(mediapipeSrcDir, file);
          const destFile = path.join(mediapipeDestDir, file);
          fs.copyFileSync(srcFile, destFile);
          console.log(`   ✅ Copiato: ${file}`);
        }
      } else {
        console.warn(`   ⚠️ MediaPipe source dir not found: ${mediapipeSrcDir}`);
        console.log('📱 [iOS] Skip configurazione (no native-modules/ios)');
        return config;
      }

      // Copia il modello
      const modelDestPath = path.join(iosGeneratedDir, 'pose_landmarker_full.task');

      if (fs.existsSync(modelSrcPath)) {
        fs.copyFileSync(modelSrcPath, modelDestPath);
        console.log('   ✅ Modello MediaPipe copiato da native-modules/ios');
      } else if (fs.existsSync(modelSrcPathAndroid)) {
        fs.copyFileSync(modelSrcPathAndroid, modelDestPath);
        console.log('   ✅ Modello MediaPipe copiato da native-modules/android');
      } else {
        console.warn('   ⚠️ Modello non trovato');
      }

      // Crea bridging header
      const bridgingHeaderDest = path.join(iosGeneratedDir, `${projectName}-Bridging-Header.h`);
      const bridgingContent = `//
//  Use this file to import your target's public headers that you would like to expose to Swift.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTRootView.h>
#import <React/RCTUtils.h>
#import <React/RCTConvert.h>
#import <React/RCTBundleURLProvider.h>

// VisionCamera Frame Processor
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>
#import <VisionCamera/Frame.h>
#import <VisionCamera/VisionCameraProxyHolder.h>
`;
      fs.writeFileSync(bridgingHeaderDest, bridgingContent);
      console.log('   ✅ Bridging header creato');

      // ============================================
      // MODIFICA DIRETTA DEL project.pbxproj
      // ============================================
      const pbxprojPath = path.join(iosDir, `${projectName}.xcodeproj`, 'project.pbxproj');

      if (!fs.existsSync(pbxprojPath)) {
        console.error(`   ❌ project.pbxproj non trovato: ${pbxprojPath}`);
        return config;
      }

      console.log('📱 [iOS] Modifica diretta project.pbxproj...');

      let pbxContent = fs.readFileSync(pbxprojPath, 'utf8');

      // File da aggiungere con i loro tipi
      const filesToAdd = [
        { name: 'MediaPipePoseModule.swift', type: 'sourcecode.swift', path: `${projectName}/MediaPipe/MediaPipePoseModule.swift` },
        { name: 'MediaPipePoseModule.m', type: 'sourcecode.c.objc', path: `${projectName}/MediaPipe/MediaPipePoseModule.m` },
        { name: 'DetectPosePlugin.swift', type: 'sourcecode.swift', path: `${projectName}/MediaPipe/DetectPosePlugin.swift` },
        { name: 'DetectPosePlugin.m', type: 'sourcecode.c.objc', path: `${projectName}/MediaPipe/DetectPosePlugin.m` },
      ];

      const modelFile = { name: 'pose_landmarker_full.task', type: 'file', path: `${projectName}/pose_landmarker_full.task` };

      // Genera UUID per ogni file
      const fileRefs = filesToAdd.map(f => ({
        ...f,
        fileRefUUID: generateUUID(),
        buildFileUUID: generateUUID()
      }));

      const modelRef = {
        ...modelFile,
        fileRefUUID: generateUUID(),
        buildFileUUID: generateUUID()
      };

      // 1. Aggiungi PBXFileReference per ogni file
      // Cerca la sezione /* Begin PBXFileReference section */
      const fileRefSectionStart = '/* Begin PBXFileReference section */';
      const fileRefSectionEnd = '/* End PBXFileReference section */';

      let fileRefEntries = '';
      for (const file of fileRefs) {
        fileRefEntries += `\t\t${file.fileRefUUID} /* ${file.name} */ = {isa = PBXFileReference; lastKnownFileType = ${file.type}; path = "${file.path}"; sourceTree = "<group>"; };\n`;
      }
      // Aggiungi anche il modello
      fileRefEntries += `\t\t${modelRef.fileRefUUID} /* ${modelRef.name} */ = {isa = PBXFileReference; lastKnownFileType = ${modelRef.type}; path = "${modelRef.path}"; sourceTree = "<group>"; };\n`;

      pbxContent = pbxContent.replace(
        fileRefSectionStart,
        fileRefSectionStart + '\n' + fileRefEntries
      );

      // 2. Aggiungi PBXBuildFile per ogni file sorgente
      const buildFileSectionStart = '/* Begin PBXBuildFile section */';

      let buildFileEntries = '';
      for (const file of fileRefs) {
        buildFileEntries += `\t\t${file.buildFileUUID} /* ${file.name} in Sources */ = {isa = PBXBuildFile; fileRef = ${file.fileRefUUID} /* ${file.name} */; };\n`;
      }
      // Il modello va in Resources, non in Sources
      buildFileEntries += `\t\t${modelRef.buildFileUUID} /* ${modelRef.name} in Resources */ = {isa = PBXBuildFile; fileRef = ${modelRef.fileRefUUID} /* ${modelRef.name} */; };\n`;

      pbxContent = pbxContent.replace(
        buildFileSectionStart,
        buildFileSectionStart + '\n' + buildFileEntries
      );

      // 3. Aggiungi i file sorgente alla Sources build phase
      // Cerca "/* Begin PBXSourcesBuildPhase section */" e poi "files = ("
      const sourcesBuildPhaseRegex = /(\/\* Begin PBXSourcesBuildPhase section \*\/[\s\S]*?files = \()/;
      const sourcesMatch = pbxContent.match(sourcesBuildPhaseRegex);

      if (sourcesMatch) {
        let sourcesEntries = '';
        for (const file of fileRefs) {
          sourcesEntries += `\t\t\t\t${file.buildFileUUID} /* ${file.name} in Sources */,\n`;
        }
        pbxContent = pbxContent.replace(
          sourcesBuildPhaseRegex,
          sourcesMatch[1] + '\n' + sourcesEntries
        );
      }

      // 4. Aggiungi il modello alla Resources build phase
      const resourcesBuildPhaseRegex = /(\/\* Begin PBXResourcesBuildPhase section \*\/[\s\S]*?files = \()/;
      const resourcesMatch = pbxContent.match(resourcesBuildPhaseRegex);

      if (resourcesMatch) {
        const resourceEntry = `\t\t\t\t${modelRef.buildFileUUID} /* ${modelRef.name} in Resources */,\n`;
        pbxContent = pbxContent.replace(
          resourcesBuildPhaseRegex,
          resourcesMatch[1] + '\n' + resourceEntry
        );
      }

      // 5. Aggiungi i file al gruppo principale (opzionale, per organizzazione)
      // Cerca il gruppo con name = Pusho e aggiungi i riferimenti ai children
      const pushoGroupRegex = new RegExp(
        `(\\s+\\/\\* ${projectName} \\*\\/ = \\{[\\s\\S]*?children = \\()`,
        'g'
      );

      let childrenEntries = '';
      for (const file of fileRefs) {
        childrenEntries += `\t\t\t\t${file.fileRefUUID} /* ${file.name} */,\n`;
      }
      childrenEntries += `\t\t\t\t${modelRef.fileRefUUID} /* ${modelRef.name} */,\n`;

      pbxContent = pbxContent.replace(pushoGroupRegex, (match, group1) => {
        return group1 + '\n' + childrenEntries;
      });

      // 6. Configura bridging header nelle build settings
      // Cerca SWIFT_OBJC_BRIDGING_HEADER o aggiungi se non esiste
      if (!pbxContent.includes('SWIFT_OBJC_BRIDGING_HEADER')) {
        // Aggiungi dopo ogni "CLANG_ENABLE_MODULES = YES;"
        pbxContent = pbxContent.replace(
          /CLANG_ENABLE_MODULES = YES;/g,
          `CLANG_ENABLE_MODULES = YES;\n\t\t\t\tSWIFT_OBJC_BRIDGING_HEADER = "${projectName}/${projectName}-Bridging-Header.h";`
        );
      }

      // Assicurati che CLANG_ENABLE_MODULES sia YES
      if (!pbxContent.includes('CLANG_ENABLE_MODULES = YES')) {
        // Aggiungi dopo ogni buildSettings = {
        pbxContent = pbxContent.replace(
          /buildSettings = \{/g,
          'buildSettings = {\n\t\t\t\tCLANG_ENABLE_MODULES = YES;'
        );
      }

      // Scrivi il file modificato
      fs.writeFileSync(pbxprojPath, pbxContent);
      console.log('   ✅ project.pbxproj modificato');

      // ============================================
      // MODIFICA PODFILE PER AGGIUNGERE MEDIAPIPE
      // ============================================
      const podfilePath = path.join(iosDir, 'Podfile');

      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');

        // Aggiungi MediaPipeTasksVision se non presente
        if (!podfileContent.includes('MediaPipeTasksVision')) {
          // Aggiungi dopo la linea "use_expo_modules!"
          podfileContent = podfileContent.replace(
            /use_expo_modules!\n/,
            `use_expo_modules!

  # MediaPipe Tasks Vision - per pose detection realtime
  pod 'MediaPipeTasksVision', '~> 0.10.14'

`
          );

          fs.writeFileSync(podfilePath, podfileContent);
          console.log('   ✅ Podfile: aggiunto MediaPipeTasksVision');
        }
      }

      console.log('📱 [iOS] Configurazione completata');

      return config;
    },
  ]);

  return config;
};

module.exports = withMediaPipePreserve;
