import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Users, AudioWaveform } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div>
          <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Audio Access Manager
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Secure audio file sharing with time-based access control. 
            Administrators can upload files and generate time-limited passwords for users.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <Card className="shadow-elegant hover:shadow-glow transition-all duration-300 group">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                  <Settings className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Admin Panel</CardTitle>
              <CardDescription>
                Upload audio files, generate access passwords, and manage user permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                <li>• Upload up to 5 WAV audio files</li>
                <li>• Generate 24h, 48h, or indefinite access passwords</li>
                <li>• Monitor active sessions and usage</li>
                <li>• Manage file permissions and access control</li>
              </ul>
              <Link to="/admin">
                <Button variant="gradient" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Access Admin Panel
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-elegant hover:shadow-glow transition-all duration-300 group">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                  <AudioWaveform className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">User Access</CardTitle>
              <CardDescription>
                Enter your access password to listen to available audio files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                <li>• Secure password-based access</li>
                <li>• Stream audio files directly in browser</li>
                <li>• Time-limited access with automatic expiry</li>
                <li>• Clean, intuitive audio player interface</li>
              </ul>
              <Link to="/user">
                <Button variant="default" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Access Audio Library
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 p-6 bg-card rounded-lg border shadow-elegant">
          <h3 className="text-lg font-semibold mb-3">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="text-center">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 font-bold">1</div>
              <p className="font-medium">Admin Upload</p>
              <p className="text-muted-foreground">Administrator uploads audio files and sets access parameters</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 font-bold">2</div>
              <p className="font-medium">Generate Password</p>
              <p className="text-muted-foreground">System creates unique passwords with time-based expiration</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 font-bold">3</div>
              <p className="font-medium">User Access</p>
              <p className="text-muted-foreground">Users enter password to access audio files within time limit</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
